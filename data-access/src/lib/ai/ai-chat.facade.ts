import { Injectable, inject, signal } from '@angular/core';
import { AiProvider, ChartPayload } from '@bugflow-2026/shared-types';
import { AiChatApiService, AiChatHistoryEntry } from './ai-chat.api';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  charts?: ChartPayload[];
}

const PROVIDER_STORAGE_KEY = 'bugflow-ai-provider';

@Injectable({ providedIn: 'root' })
export class AiChatFacade {
  private api = inject(AiChatApiService);
  private _messages = signal<AiChatMessage[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _provider = signal<AiProvider>(this.loadInitialProvider());

  readonly messages = this._messages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly provider = this._provider.asReadonly();
  readonly AiProvider = AiProvider;

  private loadInitialProvider(): AiProvider {
    const saved = sessionStorage.getItem(PROVIDER_STORAGE_KEY);
    return saved === AiProvider.DEEPSEEK ? AiProvider.DEEPSEEK : AiProvider.ANTHROPIC;
  }

  setProvider(provider: AiProvider) {
    this._provider.set(provider);
    sessionStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  }

  sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || this._loading()) return;

    const history: AiChatHistoryEntry[] = this._messages()
      .slice(-6)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    this._messages.update(msgs => [
      ...msgs,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    this._loading.set(true);
    this._error.set(null);

    this.api.chat(trimmed, history, this._provider()).subscribe({
      next: response => {
        this._messages.update(msgs => [
          ...msgs,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.answer,
            createdAt: new Date().toISOString(),
            charts: response.charts,
          },
        ]);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Could not get a response from the assistant. Please try again.');
        this._loading.set(false);
      },
    });
  }

  clear() {
    this._messages.set([]);
    this._error.set(null);
  }
}
