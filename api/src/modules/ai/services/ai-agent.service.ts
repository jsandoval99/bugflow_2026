import { Injectable, Logger } from '@nestjs/common';
import { AiProvider, ChartPayload } from '@bugflow-2026/shared-types';
import { AnthropicAgentProvider } from './providers/anthropic-agent.provider';
import { DeepseekAgentProvider } from './providers/deepseek-agent.provider';
import { AiHistoryMessage } from '../interfaces/ai-chat-provider.interface';
import { AiProviderError } from '../errors/ai-provider.error';
import { FRIENDLY_FALLBACK_ANSWER, MAX_HISTORY_MESSAGES } from '../constants/ai-system-prompt.constant';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly anthropicProvider: AnthropicAgentProvider,
    private readonly deepseekProvider: DeepseekAgentProvider,
  ) {}

  async ask(
    message: string,
    history: AiHistoryMessage[] = [],
    provider: AiProvider = AiProvider.ANTHROPIC,
  ): Promise<{ answer: string; chart?: ChartPayload }> {
    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
    const agent = provider === AiProvider.DEEPSEEK ? this.deepseekProvider : this.anthropicProvider;

    try {
      return await agent.ask(message, trimmedHistory);
    } catch (error) {
      if (error instanceof AiProviderError) {
        this.logger.error(`[${provider}] ${error.message}`, error.cause as Error);
      } else {
        this.logger.error(`[${provider}] Unexpected AI agent error`, error as Error);
      }
      return { answer: FRIENDLY_FALLBACK_ANSWER };
    }
  }
}
