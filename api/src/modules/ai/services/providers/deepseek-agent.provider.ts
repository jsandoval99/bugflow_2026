import { Injectable, Logger } from '@nestjs/common';
import { ChartPayload } from '@bugflow-2026/shared-types';
import { AI_TOOLS, toOpenAiTools } from '../../ai-tools.definitions';
import { AI_STATIC_SYSTEM_PROMPT, DEEPSEEK_URL, MAX_ITERATIONS, MAX_TOKENS } from '../../constants/ai-system-prompt.constant';
import { AiChatProvider, AiHistoryMessage } from '../../interfaces/ai-chat-provider.interface';
import { AiToolExecutorService } from '../ai-tool-executor.service';
import { AiProviderError } from '../../errors/ai-provider.error';

@Injectable()
export class DeepseekAgentProvider implements AiChatProvider {
  private readonly logger = new Logger(DeepseekAgentProvider.name);
  private readonly apiKey = process.env.DEEPSEEK_API_KEY;

  constructor(private readonly toolExecutor: AiToolExecutorService) {}

  async ask(message: string, history: AiHistoryMessage[] = []): Promise<{ answer: string; charts?: ChartPayload[] }> {
    if (!this.apiKey) {
      throw new AiProviderError('DeepSeek API key is not configured');
    }

    const systemContent = `${AI_STATIC_SYSTEM_PROMPT}\n\nCurrent server date and time (UTC): ${new Date().toISOString()}`;
    const messages: any[] = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: message },
    ];
    let finalText = '';
    const chartPayloads: ChartPayload[] = [];

    try {
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const res = await fetch(DEEPSEEK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            max_tokens: MAX_TOKENS,
            messages,
            tools: toOpenAiTools(AI_TOOLS),
            tool_choice: i === 0 ? 'required' : 'auto',
            temperature: 0
          }),
        });

        if (!res.ok) {
          throw new Error(`DeepSeek API error (${res.status}): ${await res.text()}`);
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;

        if (!toolCalls?.length) {
          finalText = choice?.message?.content ?? '';
          break;
        }

        messages.push(choice.message);

        const toolResults = await Promise.all(
          toolCalls.map(async (call: any) => {
            const result = await this.toolExecutor.execute(call.function.name, JSON.parse(call.function.arguments || '{}'));
            if (call.function.name === 'generate_chart_data') {
              chartPayloads.push(result as ChartPayload);
            }
            return {
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify(result),
            };
          }),
        );

        messages.push(...toolResults);
      }
    } catch (error) {
      this.logger.error('DeepSeek provider failed', error as Error);
      throw new AiProviderError('DeepSeek provider request failed', error);
    }

    return {
      answer: finalText || "I couldn't generate a response with the available information.",
      charts: chartPayloads.length ? chartPayloads : undefined,
    };
  }
}
