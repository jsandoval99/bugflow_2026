import { Injectable, computed, effect, inject } from '@angular/core';
import { BugFlowNotification } from '@bugflow-2026/shared-types';
import { SocketService } from '@bugflow-2026/realtime';
import { NotificationsStore } from './notifications.store';
import { UsersFacade } from '../users/users.facade';
import { NotificationsApiService } from './notifications.api';

@Injectable({
  providedIn: 'root',
})
export class NotificationsFacade {
  private store = inject(NotificationsStore);
  private socketService = inject(SocketService);
  private usersFacade = inject(UsersFacade);
  private notificationsApi = inject(NotificationsApiService);
  private joinedUser = false;

  readonly notifications = computed(() => this.store.state().data);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  readonly state = this.store.state.asReadonly();

  constructor() {
    effect(() => {
      const user = this.usersFacade.me();
      if (!user || this.joinedUser) {
        return;
      }

      this.joinedUser = true;
      this.socketService.joinUser(user.id);
    });

    this.socketService.onNotificationCreated(notification => {
      this.store.prepend(notification);
    });

    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationsApi
      .getNotifications()
      .subscribe(notifications => {
        this.store.setNotifications(notifications);
      });
  }

  markAsRead(id: string) {
    this.store.markAsRead(id);
    this.notificationsApi
      .markAsRead(id)
      .subscribe();
  }

  markAllAsRead() {
    this.store.markAllAsRead();
    this.notificationsApi
      .markAllAsRead()
      .subscribe();
  }

  clearNotifications() {
    this.store.clearNotifications();
    this.notificationsApi
      .clearNotifications()
      .subscribe();
  }

  pushNotification(
    notification: BugFlowNotification,
  ) {
    this.store.prepend(notification);
  }
}
