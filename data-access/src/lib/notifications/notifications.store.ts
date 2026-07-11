import { Injectable, signal } from '@angular/core';
import { BugFlowNotification } from '@bugflow-2026/shared-types';

export interface NotificationsState {
  loading: boolean;
  data: BugFlowNotification[];
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsStore {
  state = signal<NotificationsState>({
    loading: false,
    data: [],
  });

  setLoading(loading: boolean) {
    this.state.update(state => ({
      ...state,
      loading,
    }));
  }

  setNotifications(
    notifications: BugFlowNotification[],
  ) {
    this.state.set({
      loading: false,
      data: notifications,
    });
  }

  markAsRead(id: string) {
    this.state.update(state => ({
      ...state,
      data: state.data.map(notification =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      ),
    }));
  }

  markAllAsRead() {
    this.state.update(state => ({
      ...state,
      data: state.data.map(notification => ({
        ...notification,
        read: true,
      })),
    }));
  }

  clearNotifications() {
    this.state.update(state => ({
      ...state,
      data: [],
    }));
  }

  deleteNotification(id: string) {
    this.state.update(state => ({
      ...state,
      data: state.data.filter(
        notification => notification.id !== id
      ),
    }));
  }

  prepend(notification: BugFlowNotification) {
    this.state.update(state => ({
      ...state,
      data: [
        notification,
        ...state.data,
      ].slice(0, 100),
    }));
  }
}
