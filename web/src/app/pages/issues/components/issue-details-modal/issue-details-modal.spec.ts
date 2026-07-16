import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IssueDetailsModalComponent } from './issue-details-modal';
import { SocketService } from '@bugflow-2026/realtime';
import { IssueWatchersApiFacade } from '@bugflow-2026/data-access';
import { Issue, IssuePriority, IssueStatus } from '@bugflow-2026/shared-types';

describe('IssueDetailsModalComponent', () => {
  let component: IssueDetailsModalComponent;
  let fixture: ComponentFixture<IssueDetailsModalComponent>;

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

  const issueWatchersFacade = {
    isWatching: jest.fn(),
    watch: jest.fn(),
    unwatch: jest.fn(),
  };

  const issue: Issue = {
    id: 'issue-1',
    title: 'Login fails on Safari',
    description: 'Authentication flow fails on Safari browsers.',
    status: IssueStatus.OPEN,
    priority: IssuePriority.HIGH,
    assignee: null,
    projectId: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    issueWatchersFacade.isWatching.mockReturnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [IssueDetailsModalComponent],
      providers: [
        { provide: SocketService, useValue: socketService },
        { provide: IssueWatchersApiFacade, useValue: issueWatchersFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueDetailsModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('open', () => {
    it('joins the issue room, sets the issue and opens the modal', () => {
      component.open(issue);

      expect(socketService.joinIssue).toHaveBeenCalledWith('issue-1');
      expect(component.issue()).toBe(issue);
      expect(component.isOpen()).toBe(true);
    });

    it('reflects the watching state returned by the facade', () => {
      issueWatchersFacade.isWatching.mockReturnValue(of(true));

      component.open(issue);

      expect(issueWatchersFacade.isWatching).toHaveBeenCalledWith('issue-1');
      expect(component.isWatching()).toBe(true);
    });

    it('defaults to not watching when the facade returns false', () => {
      issueWatchersFacade.isWatching.mockReturnValue(of(false));

      component.open(issue);

      expect(component.isWatching()).toBe(false);
    });
  });

  describe('close', () => {
    it('leaves the issue room and resets the state', () => {
      component.open(issue);

      component.close();

      expect(socketService.leaveIssue).toHaveBeenCalledWith('issue-1');
      expect(component.isOpen()).toBe(false);
      expect(component.issue()).toBeNull();
    });

    it('does not try to leave a room when there is no issue open', () => {
      component.close();

      expect(socketService.leaveIssue).not.toHaveBeenCalled();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('handleEscape', () => {
    it('closes the modal when it is open', () => {
      component.open(issue);

      component.handleEscape();

      expect(component.isOpen()).toBe(false);
      expect(socketService.leaveIssue).toHaveBeenCalledWith('issue-1');
    });

    it('does nothing when the modal is already closed', () => {
      component.handleEscape();

      expect(socketService.leaveIssue).not.toHaveBeenCalled();
    });
  });

  describe('observe', () => {
    it('does nothing when there is no issue open', () => {
      component.observe();

      expect(issueWatchersFacade.watch).not.toHaveBeenCalled();
      expect(issueWatchersFacade.unwatch).not.toHaveBeenCalled();
    });

    it('does nothing while a watch request is already in flight', () => {
      component.open(issue);
      component.watchLoading.set(true);

      component.observe();

      expect(issueWatchersFacade.watch).not.toHaveBeenCalled();
      expect(issueWatchersFacade.unwatch).not.toHaveBeenCalled();
    });

    it('calls watch and flips isWatching to true when not currently watching', () => {
      issueWatchersFacade.watch.mockReturnValue(of({}));
      component.open(issue);

      component.observe();

      expect(issueWatchersFacade.watch).toHaveBeenCalledWith('issue-1');
      expect(issueWatchersFacade.unwatch).not.toHaveBeenCalled();
      expect(component.isWatching()).toBe(true);
      expect(component.watchLoading()).toBe(false);
    });

    it('calls unwatch and flips isWatching to false when currently watching', () => {
      issueWatchersFacade.isWatching.mockReturnValue(of(true));
      issueWatchersFacade.unwatch.mockReturnValue(of({}));
      component.open(issue);

      component.observe();

      expect(issueWatchersFacade.unwatch).toHaveBeenCalledWith('issue-1');
      expect(issueWatchersFacade.watch).not.toHaveBeenCalled();
      expect(component.isWatching()).toBe(false);
      expect(component.watchLoading()).toBe(false);
    });

    it('releases watchLoading without toggling isWatching on error', () => {
      issueWatchersFacade.watch.mockReturnValue(throwError(() => new Error('Network error')));
      component.open(issue);

      component.observe();

      expect(component.isWatching()).toBe(false);
      expect(component.watchLoading()).toBe(false);
    });
  });
});
