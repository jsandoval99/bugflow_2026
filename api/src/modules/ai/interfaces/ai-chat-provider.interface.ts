import { ChartPayload } from '@bugflow-2026/shared-types';

export interface AiHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatProvider {
  ask(message: string, history: AiHistoryMessage[]): Promise<{ answer: string; charts?: ChartPayload[] }>;
}
