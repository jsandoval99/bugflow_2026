import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateIssuePayload, Issue, DEFAULT_PAGE_SIZE, PaginatedResponse, UpdateIssuePayload } from '@bugflow-2026/shared-types';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api-config.token';

@Injectable({ providedIn: 'root' })
export class IssuesApiService {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private baseUrl = `${this.config.baseUrl}/issues`;
  private defaultPageSize = DEFAULT_PAGE_SIZE;

  getIssues(filters: {
    status?: string;
    priority?: string;
    search?: string;
    projectId?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Issue>> {
    return this.http.get<PaginatedResponse<Issue>>(this.baseUrl, {
      params: {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
        ...(filters.projectId && { projectId: filters.projectId }),
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? this.defaultPageSize,
      },
    });
  }

  getIssue(id: string): Observable<Issue> {
    return this.http.get<Issue>(
      `${this.baseUrl}/${id}`,
    );
  }

  createIssue(data: CreateIssuePayload) {
    return this.http.post(this.baseUrl, data);
  }

  updateIssue(id: string, data: UpdateIssuePayload) {
    return this.http.patch(`${this.baseUrl}/${id}`, data);
  }

}
