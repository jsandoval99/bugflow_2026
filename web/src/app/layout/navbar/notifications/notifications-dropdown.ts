import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsFacade } from '@bugflow-2026/data-access';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  templateUrl: './notifications-dropdown.html',
})
export class NotificationsDropdown {
  private router = inject(Router);
  readonly facade = inject(NotificationsFacade);

  open = signal(false);
  unreadCount = this.facade.unreadCount;

  toggle() {
    this.open.update(v => !v);
  }

  close() {
    this.open.set(false);
  }

  markAsRead(id: string) {
    this.facade.markAsRead(id);
  }

  markAllAsRead() {
    this.facade.markAllAsRead();
  }

  clearNotifications() {
    if (!confirm('Delete all notifications?')) {
      return;
    }
    this.facade.clearNotifications();
  }

  openIssue(issueId: string) {
    this.close();
    this.router.navigate(['/issues'], {
      queryParams: {
        issueId,
      },
      queryParamsHandling: 'merge',
    });
  }
}
