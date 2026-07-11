import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ChartPayload } from '@bugflow-2026/shared-types';
import { AI_TOOLS } from '../../ai-tools.definitions';
import { AI_STATIC_SYSTEM_PROMPT, MAX_ITERATIONS, MAX_TOKENS } from '../../constants/ai-system-prompt.constant';
import { AiChatProvider, AiHistoryMessage } from '../../interfaces/ai-chat-provider.interface';
import { AiToolExecutorService } from '../ai-tool-executor.service';
import { AiProviderError } from '../../errors/ai-provider.error';

@Injectable()
export class AnthropicAgentProvider implements AiChatProvider {
  private readonly logger = new Logger(AnthropicAgentProvider.name);
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(private readonly toolExecutor: AiToolExecutorService) {}

  async ask(message: string, history: AiHistoryMessage[] = []): Promise<{ answer: string; chart?: ChartPayload }> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new AiProviderError('Anthropic API key is not configured');
    }

    const messages: any[] = [...history, { role: 'user', content: message }];
    let finalText = '';
    let chartPayload: ChartPayload | undefined;

    try {
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: MAX_TOKENS,
          system: [
            {
              type: 'text',
              text: AI_STATIC_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' }, // cacheable block
            },
            {
              type: 'text',
              text: `Current server date and time (UTC): ${new Date().toISOString()}`,
            },
          ],
          tools: AI_TOOLS.map((tool, idx) =>
            idx === AI_TOOLS.length - 1
              ? { ...tool, cache_control: { type: 'ephemeral' } }
              : tool,
          ) as any,
          messages,
        });

        const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

        if (!toolUseBlocks.length) {
          finalText = response.content
            .filter(b => b.type === 'text')
            .map(b => (b as any).text)
            .join('\n');
          break;
        }

        messages.push({ role: 'assistant', content: response.content });

        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block: any) => {
            const result = await this.toolExecutor.execute(block.name, block.input);
            if (block.name === 'generate_chart_data') {
              chartPayload = result as ChartPayload;
            }
            return {
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          }),
        );

        messages.push({ role: 'user', content: toolResults });
      }
    } catch (error) {
      this.logger.error('Anthropic provider failed', error as Error);
      throw new AiProviderError('Anthropic provider request failed', error);
    }

    return {
      answer: finalText || "I couldn't generate a response with the available information.",
      chart: chartPayload,
    };
  }
}
