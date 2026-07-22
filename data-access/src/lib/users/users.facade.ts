import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '@bugflow-2026/shared-types';
import { API_CONFIG } from '../api-config.token';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private http = inject(HttpClient);
  private config = inject(API_CONFIG);
  private baseUrl = `${this.config.baseUrl}/users`;
  private me$ = this.getMe();
  me = toSignal(this.me$, { initialValue: null });

  getAssignableUsers() {
    return this.http.get<User[]>(`${this.baseUrl}/assignable`);
  }

  getAllUsers() {
    return this.http.get<User[]>(this.baseUrl);
  }

  getMe() {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }
}
