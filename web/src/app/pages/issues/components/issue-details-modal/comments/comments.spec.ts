import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CommentsComponent } from './comments';
import { CommentsFacade, UsersFacade } from '@bugflow-2026/data-access';
import { SocketService } from '@bugflow-2026/realtime';
import { Comment, User } from '@bugflow-2026/shared-types';
import { ConfirmDialogService } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.service';

describe('CommentsComponent', () => {
  let component: CommentsComponent;
  let fixture: ComponentFixture<CommentsComponent>;

  const meSignal = signal<User | null>(null);

  const commentsFacade = {
    commentsState: signal({
      data: [] as Comment[],
      loading: false,
      error: null,
    }),
    setIssue: jest.fn(),
    refresh: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
  };

  const socketService = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinIssue: jest.fn(),
    leaveIssue: jest.fn(),
    onCommentCreated: jest.fn(),
    onCommentUpdated: jest.fn(),
    onCommentDeleted: jest.fn(),
    offCommentCreated: jest.fn(),
    offCommentUpdated: jest.fn(),
    offCommentDeleted: jest.fn(),
  };

  const confirmDialogService = {
    confirm: jest.fn(),
  };

  const comment: Comment = {
    id: 'comment-1',
    content: 'Original comment',
    authorId: 'auth0|owner',
    issueId: 'issue-1',
    author: { id: 'auth0|owner', name: 'Owner' },
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    meSignal.set(null);
    commentsFacade.createComment.mockReturnValue(of({}));
    commentsFacade.updateComment.mockReturnValue(of({}));
    commentsFacade.deleteComment.mockReturnValue(of({}));
    confirmDialogService.confirm.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [CommentsComponent],
      providers: [
        { provide: UsersFacade, useValue: { me: meSignal } },
        { provide: CommentsFacade, useValue: commentsFacade },
        { provide: SocketService, useValue: socketService },
        { provide: ConfirmDialogService, useValue: confirmDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('issueId', 'issue-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('issueId effect', () => {
    it('sets the issue on the facade and joins the socket room', () => {
      expect(commentsFacade.setIssue).toHaveBeenCalledWith('issue-1');
      expect(socketService.joinIssue).toHaveBeenCalledWith('issue-1');
    });
  });

  describe('realtime listeners', () => {
    it('refreshes when a comment is created for the current issue', () => {
      const [callback] = socketService.onCommentCreated.mock.calls[0];
      callback('issue-1');
      expect(commentsFacade.refresh).toHaveBeenCalled();
    });

    it('does not refresh when the event is for a different issue', () => {
      const [callback] = socketService.onCommentCreated.mock.calls[0];
      callback('issue-2');
      expect(commentsFacade.refresh).not.toHaveBeenCalled();
    });

    it('refreshes on comment updated for the current issue', () => {
      const [callback] = socketService.onCommentUpdated.mock.calls[0];
      callback('issue-1');
      expect(commentsFacade.refresh).toHaveBeenCalled();
    });

    it('refreshes on comment deleted for the current issue', () => {
      const [callback] = socketService.onCommentDeleted.mock.calls[0];
      callback('issue-1');
      expect(commentsFacade.refresh).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('leaves the issue room and removes all listeners', () => {
      component.ngOnDestroy();

      expect(socketService.leaveIssue).toHaveBeenCalledWith('issue-1');
      expect(socketService.offCommentCreated).toHaveBeenCalled();
      expect(socketService.offCommentUpdated).toHaveBeenCalled();
      expect(socketService.offCommentDeleted).toHaveBeenCalled();
    });
  });

  describe('isOwner', () => {
    it('returns true when the authorId matches the current user auth0Id', () => {
      meSignal.set({ auth0Id: 'auth0|owner' } as User);
      expect(component.isOwner('auth0|owner')).toBe(true);
    });

    it('returns false when there is no current user or it does not match', () => {
      meSignal.set(null);
      expect(component.isOwner('auth0|owner')).toBe(false);

      meSignal.set({ auth0Id: 'auth0|someone-else' } as User);
      expect(component.isOwner('auth0|owner')).toBe(false);
    });
  });

  describe('startEdit / cancelEdit', () => {
    it('enters edit mode and patches the form with the comment content', () => {
      component.startEdit(comment);

      expect(component.editingCommentId()).toBe('comment-1');
      expect(component.form.getRawValue().content).toBe('Original comment');
    });

    it('exits edit mode and resets the form', () => {
      component.startEdit(comment);

      component.cancelEdit();

      expect(component.editingCommentId()).toBeNull();
      expect(component.form.getRawValue().content).toBe('');
    });
  });

  describe('deleteComment', () => {
    it('does nothing when the confirm dialog is cancelled', async () => {
      confirmDialogService.confirm.mockResolvedValue(false);

      await component.deleteComment('comment-1');

      expect(commentsFacade.deleteComment).not.toHaveBeenCalled();
    });

    it('deletes the comment when confirmed', async () => {
      confirmDialogService.confirm.mockResolvedValue(true);

      await component.deleteComment('comment-1');

      expect(confirmDialogService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Delete this comment?' }),
      );
      expect(commentsFacade.deleteComment).toHaveBeenCalledWith('issue-1', 'comment-1');
    });
  });

  describe('submit', () => {
    it('marks the form as touched and does not call the facade when invalid', () => {
      component.submit();

      expect(commentsFacade.createComment).not.toHaveBeenCalled();
      expect(commentsFacade.updateComment).not.toHaveBeenCalled();
      expect(component.form.get('content')?.touched).toBe(true);
    });

    it('creates a new comment when not in edit mode', () => {
      component.form.patchValue({ content: 'New comment' });

      component.submit();

      expect(commentsFacade.createComment).toHaveBeenCalledWith('issue-1', 'New comment');
      expect(commentsFacade.updateComment).not.toHaveBeenCalled();
      expect(component.loading()).toBe(false);
      expect(component.form.getRawValue().content).toBe('');
    });

    it('updates the existing comment when in edit mode', () => {
      component.startEdit(comment);
      component.form.patchValue({ content: 'Updated comment' });

      component.submit();

      expect(commentsFacade.updateComment).toHaveBeenCalledWith(
        'issue-1',
        'comment-1',
        'Updated comment',
      );
      expect(commentsFacade.createComment).not.toHaveBeenCalled();
      expect(component.editingCommentId()).toBeNull();
    });

    it('sets loading false without resetting the form on error', () => {
      commentsFacade.createComment.mockReturnValue(throwError(() => new Error('Network error')));
      component.form.patchValue({ content: 'New comment' });

      component.submit();

      expect(component.loading()).toBe(false);
      expect(component.form.getRawValue().content).toBe('New comment');
    });
  });
});
