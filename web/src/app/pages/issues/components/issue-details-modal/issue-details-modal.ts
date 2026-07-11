import { Component, signal, HostListener, inject } from '@angular/core';
import { Issue } from '@bugflow-2026/shared-types';
import { BadgeComponent } from '../../../../shared/ui/badge/badge';
import { CommentsComponent } from './comments/comments';
import { SocketService } from '@bugflow-2026/realtime';
import { IssueWatchersApiFacade } from '@bugflow-2026/data-access';

@Component({
  selector: 'app-issue-details-modal',
  standalone: true,
  imports: [
    BadgeComponent,
    CommentsComponent,
  ],
  templateUrl: './issue-details-modal.html',
})
export class IssueDetailsModalComponent {
  issue = signal<Issue | null>(null);
  isOpen = signal(false);
  isWatching = signal(false);
  watchLoading = signal(false);
  private socketService = inject(SocketService);
  private issueWatchersFacade = inject(IssueWatchersApiFacade);

  open(issue: Issue) {
    document.body.style.overflow = 'hidden';
    this.socketService.joinIssue(issue.id);
    this.issue.set(issue);
    this.isOpen.set(true);
    this.issueWatchersFacade.isWatching(issue.id).subscribe(watching => this.isWatching.set(watching));
  }

  close() {
    const issueId = this.issue()?.id;
    document.body.style.overflow = '';

    if (issueId) {
      this.socketService.leaveIssue(issueId);
    }
    this.isOpen.set(false);
    this.issue.set(null);
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (!this.isOpen()) return;

    this.close();
  }

  observe() {
    const issue = this.issue();
    if (!issue || this.watchLoading()) return;

    this.watchLoading.set(true);
    const request$ = this.isWatching()
      ? this.issueWatchersFacade.unwatch(issue.id)
      : this.issueWatchersFacade.watch(issue.id);

    request$.subscribe({
      next: () => {
        this.isWatching.update(v => !v);
        this.watchLoading.set(false);
      },
      error: () => this.watchLoading.set(false),
    });
  }
}
