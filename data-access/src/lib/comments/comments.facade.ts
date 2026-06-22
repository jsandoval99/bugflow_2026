import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith, of } from 'rxjs';
import { CommentsApiService } from './comments.api';

@Injectable({
  providedIn: 'root',
})
export class CommentsFacade {
  private api = inject(CommentsApiService);
  private issueId = signal<string | null>(null);
  private refreshTrigger = signal(0);

  readonly commentsState = toSignal(
    toObservable(
      computed(() => ({
        issueId: this.issueId(),
        refresh: this.refreshTrigger(),
      }))
    ).pipe(
      switchMap(({ issueId }) => {
        if (!issueId) {
          return of({
            data: [],
            loading: false,
          });
        }

        return this.api
          .getComments(issueId)
          .pipe(
            map(data => ({
              data,
              loading: false,
            })),
            startWith({
              data: [],
              loading: true,
            }),
          );
      }),
    ),
    {
      initialValue: {
        data: [],
        loading: false,
      },
    },
  );

  setIssue(issueId: string | null) {
    this.issueId.set(issueId);
  }

  refresh() {
    this.refreshTrigger.update(v => v + 1);
  }

  createComment(
    issueId: string,
    content: string,
  ) {
    return this.api.createComment(
      issueId,
      { content },
    );
  }

  updateComment(
    issueId: string,
    commentId: string,
    content: string,
  ) {
    return this.api.updateComment(
      issueId,
      commentId,
      content,
    );
  }

  deleteComment(
    issueId: string,
    commentId: string,
  ) {
    return this.api.deleteComment(
      issueId,
      commentId,
    );
  }

}
