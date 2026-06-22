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
      this.joinIssues();
    });
  }

  joinProject(projectId: string) {
    this.socket.emit('join-project', projectId);
  }

  joinIssues() {
    this.socket.emit('join-issues');
  }

  onIssueCreated(callback: (issue: Issue) => void) {
    this.socket.on('issue-created', callback);
  }
  onIssueUpdated(callback: (issue: Issue) => void) {
    this.socket.on('issue-updated', callback);
  }
  onIssueDeleted(callback: (issue: Issue) => void) {
    this.socket.on('issue-deleted', callback);
  }

  joinIssue(issueId: string) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('join-issue', issueId);
  }
  leaveIssue(issueId: string) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('leave-issue', issueId);
  }

  onCommentCreated(callback: (issueId: string) => void) {
    this.socket.on('comment-created', callback);
  }
  onCommentUpdated(callback: (issueId: string) => void) {
    this.socket.on('comment-updated', callback);
  }
  onCommentDeleted(callback: (issueId: string) => void) {
    this.socket.on('comment-deleted', callback);
  }

  offCommentCreated() {
    this.socket.off('comment-created');
  }
  offCommentUpdated() {
    this.socket.off('comment-updated');
  }
  offCommentDeleted() {
    this.socket.off('comment-deleted');
  }

  disconnect() {
    this.socket.disconnect();
  }
}
