import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../api-config.token';

@Injectable({ providedIn: 'root' })
export class IssueWatchersApiService {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private baseUrl = `${this.config.baseUrl}/issues`;

  isWatching(issueId: string) {
    return this.http.get<boolean>(`${this.baseUrl}/${issueId}/watch`);
  }

  watch(issueId: string) {
    return this.http.post(`${this.baseUrl}/${issueId}/watch`, {});
  }

  unwatch(issueId: string) {
    return this.http.delete(`${this.baseUrl}/${issueId}/watch`);
  }

}
