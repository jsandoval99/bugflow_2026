import { io, Socket } from 'socket.io-client';
import { inject, Injectable } from '@angular/core';
import { BugFlowNotification, Issue } from '@bugflow-2026/shared-types';
import { REALTIME_CONFIG } from './realtime-config.token';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private config = inject(REALTIME_CONFIG);
  private socket!: Socket;
  private currentUserId?: string;

  connect() {
    this.socket = io(this.config.socketUrl, {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.joinIssues();
      if (this.currentUserId) {
        this.joinUser(this.currentUserId);
      }
    });
  }

  // ==========================
  // Rooms
  // ==========================
  joinIssues() {
    this.socket.emit('join-issues');
  }
  joinProject(projectId: string) {
    this.socket.emit('join-project', projectId);
  }
  leaveProject(projectId: string) {
    this.socket.emit('leave-project', projectId);
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
  joinUser(userId: string) {
    this.currentUserId = userId;
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('join-user', userId);
  }

  // ==========================
  // Issues
  // ==========================
  onIssueCreated(callback: (issue: Issue) => void) {
    this.socket.on('issue-created', callback);
  }
  offIssueCreated(callback: (issue: Issue) => void) {
    this.socket.off('issue-created', callback);
  }
  onIssueUpdated(callback: (issue: Issue) => void) {
    this.socket.on('issue-updated', callback);
  }
  offIssueUpdated(callback: (issue: Issue) => void) {
    this.socket.off('issue-updated', callback);
  }
  onIssueDeleted(callback: (issue: Issue) => void) {
    this.socket.on('issue-deleted', callback);
  }
  offIssueDeleted(callback: (issueId: string) => void) {
    this.socket.off('issue-deleted', callback);
  }

  // ==========================
  // Comments
  // ==========================
  onCommentCreated(callback: (issueId: string) => void) {
    this.socket.on('comment-created', callback);
  }
  offCommentCreated() {
    this.socket.off('comment-created');
  }
  onCommentUpdated(callback: (issueId: string) => void) {
    this.socket.on('comment-updated', callback);
  }
  offCommentUpdated() {
    this.socket.off('comment-updated');
  }
  onCommentDeleted(callback: (issueId: string) => void) {
    this.socket.on('comment-deleted', callback);
  }
  offCommentDeleted() {
    this.socket.off('comment-deleted');
  }

  // ==========================
  // Notifications
  // ==========================
  onNotificationCreated(
    callback: (notification: BugFlowNotification) => void,
  ) {
    this.socket.on('notification-created', callback);
  }
  offNotificationCreated(
    callback: (notification: BugFlowNotification) => void,
  ) {
    this.socket.off('notification-created', callback);
  }

  // ==========================
  // Disconnect
  // ==========================
  disconnect() {
    this.socket.disconnect();
  }
}
