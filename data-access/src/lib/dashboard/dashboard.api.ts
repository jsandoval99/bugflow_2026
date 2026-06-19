import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardStats } from '@bugflow-2026/shared-types';
import { API_CONFIG } from '../api-config.token';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private baseUrl = `${this.config.baseUrl}/issues`;

  getStats() {
    return this.http.get<DashboardStats>(
      `${this.baseUrl}/stats`
    );
  }
}
