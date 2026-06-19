import { io, Socket } from 'socket.io-client';
import { inject, Injectable } from '@angular/core';
import { Issue } from '@bugflow-2026/shared-types';
import { REALTIME_CONFIG } from './realtime-config.token';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private config = inject(REALTIME_CONFIG);
  private socket!: Socket;

  connect() {
    this.socket = io(this.config.socketUrl, {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.joinIssues();
    });
  }

  joinIssues() {
    this.socket.emit('join-issues');
  }

  joinProject(projectId: string) {
    this.socket.emit('join-project', projectId);
  }

  onIssueUpdated(callback: (issue: Issue) => void) {
    this.socket.on('issue-updated', callback);
  }

  onIssueCreated(callback: (issue: Issue) => void) {
    this.socket.on('issue-created', callback);
  }

  onIssueDeleted(callback: (issue: Issue) => void) {
    this.socket.on('issue-deleted', callback);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
