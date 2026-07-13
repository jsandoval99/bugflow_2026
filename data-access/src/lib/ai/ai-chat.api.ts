import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AiProvider, ChartPayload } from '@bugflow-2026/shared-types';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api-config.token';

export interface AiChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  answer: string;
  charts?: ChartPayload[];
}

@Injectable({ providedIn: 'root' })
export class AiChatApiService {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private baseUrl = `${this.config.baseUrl}/ai`;

  chat(
    message: string,
    history: AiChatHistoryEntry[],
    provider: AiProvider,
  ): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.baseUrl}/chat`, { message, history, provider });
  }
}
