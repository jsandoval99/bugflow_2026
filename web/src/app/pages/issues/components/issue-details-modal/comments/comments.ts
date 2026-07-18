import { Component, inject, input, signal, effect, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentsFacade, UsersFacade } from '@bugflow-2026/data-access';
import { SocketService } from '@bugflow-2026/realtime';
import { Comment } from '@bugflow-2026/shared-types';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './comments.html',
})
export class CommentsComponent implements OnDestroy {
  private fb = inject(FormBuilder).nonNullable;
  private usersFacade = inject(UsersFacade);
  private socketService = inject(SocketService);
  readonly facade = inject(CommentsFacade);

  currentUser = this.usersFacade.me;
  issueId = input.required<string>();
  editingCommentId = signal<string | null>(null);
  loading = signal(false);
  form = this.fb.group({
    content: this.fb.control(
      '',
      Validators.required,
    ),
  });

  constructor() {
    effect(() => {
      this.facade.setIssue(this.issueId());
      this.socketService.joinIssue(this.issueId());
    });

    this.socketService.onCommentCreated(issueId => {
      if (issueId === this.issueId()) {
        this.facade.refresh();
      }
    });
    this.socketService.onCommentUpdated(issueId => {
      if (issueId === this.issueId()) {
        this.facade.refresh();
      }
    });
    this.socketService.onCommentDeleted(issueId => {
      if (issueId === this.issueId()) {
        this.facade.refresh();
      }
    });
  }

  ngOnDestroy() {
    this.socketService.leaveIssue(this.issueId());
    this.socketService.offCommentCreated();
    this.socketService.offCommentUpdated();
    this.socketService.offCommentDeleted();
  }

  formatDate(date: string) {
    return new Intl.DateTimeFormat(
      'en',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    ).format(new Date(date));
  }

  isOwner(authorId: string) {
    return (
      this.currentUser()?.auth0Id === authorId
    );
  }

  startEdit(comment: Comment) {
    this.editingCommentId.set(comment.id);
    this.form.patchValue({
      content: comment.content,
    });
  }

  deleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) {
      return;
    }
    this.facade
      .deleteComment(
        this.issueId(),
        commentId,
      )
      .subscribe();
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.form.reset();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const content = this.form.getRawValue().content;
    const editingId = this.editingCommentId();
    const request$ = editingId
      ? this.facade.updateComment(
          this.issueId(),
          editingId,
          content,
        )
      : this.facade.createComment(
          this.issueId(),
          content,
        );

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.form.reset();
        this.editingCommentId.set(null);
        this.facade.refresh();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
