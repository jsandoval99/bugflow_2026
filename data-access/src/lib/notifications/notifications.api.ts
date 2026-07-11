import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BugFlowNotification } from '@bugflow-2026/shared-types';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api-config.token';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private baseUrl = `${this.config.baseUrl}/notifications`;

  getNotifications(): Observable<BugFlowNotification[]> {
    return this.http.get<BugFlowNotification[]>(this.baseUrl);
  }

  markAsRead(id: string) {
    return this.http.patch(
      `${this.baseUrl}/${id}/read`,
      {},
    );
  }

  markAllAsRead() {
    return this.http.patch(
      `${this.baseUrl}/read-all`,
      {},
    );
  }

  clearNotifications() {
    return this.http.delete(this.baseUrl);
  }

}
