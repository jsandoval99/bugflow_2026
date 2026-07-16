import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CreateIssueModalComponent } from './create-issue-modal';
import { IssuesFacade, ProjectsFacade, UsersFacade } from '@bugflow-2026/data-access';
import { Issue, IssuePriority, IssueStatus, User } from '@bugflow-2026/shared-types';
import { NotificationService } from '../../../../core/services/notification.service/notification.service';

describe('CreateIssueModalComponent', () => {
  let component: CreateIssueModalComponent;
  let fixture: ComponentFixture<CreateIssueModalComponent>;

  const meSignal = signal<User | null>(null);

  const issuesFacade = {
    createIssue: jest.fn(),
    updateIssue: jest.fn(),
    refresh: jest.fn(),
  };

  const projectsFacade = {
    refresh: jest.fn(),
    projectsState: signal({
      data: [{ id: 'proj-1', name: 'BugFlow Internal' }],
    }),
  };

  const usersFacade = {
    me: meSignal,
    getAssignableUsers: jest.fn(),
  };

  const notificationService = {
    show: jest.fn(),
  };

  const assignableUsers = [
    { id: 'db-dev', auth0Id: 'auth0|dev', name: 'Dev', email: 'dev@bugflow.com', role: 'developer' },
    { id: 'db-tester', auth0Id: 'auth0|tester', name: 'Tester', email: 'tester@bugflow.com', role: 'tester' },
  ] as unknown as User[];

  const existingIssue: Issue = {
    id: 'issue-1',
    title: 'Original title',
    description: 'Original description',
    status: IssueStatus.IN_PROGRESS,
    priority: IssuePriority.HIGH,
    assignee: { id: 'auth0|dev', name: 'Dev', dbId: 'db-dev' },
    projectId: 'proj-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    meSignal.set(null);
    usersFacade.getAssignableUsers.mockReturnValue(of(assignableUsers));

    await TestBed.configureTestingModule({
      imports: [CreateIssueModalComponent],
      providers: [
        { provide: IssuesFacade, useValue: issuesFacade },
        { provide: ProjectsFacade, useValue: projectsFacade },
        { provide: UsersFacade, useValue: usersFacade },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateIssueModalComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('open', () => {
    it('resets the form to defaults and loads assignable users when opening without an issue', () => {
      component.open();

      expect(component.isOpen()).toBe(true);
      expect(component.currentIssue()).toBeNull();
      expect(component.isEditMode()).toBe(false);
      expect(usersFacade.getAssignableUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(assignableUsers);

      const value = component.form.getRawValue();
      expect(value.title).toBe('');
      expect(value.description).toBe('');
      expect(value.priority).toBe(IssuePriority.MEDIUM);
      expect(value.status).toBe(IssueStatus.OPEN);
      expect(value.assignee).toBe('');
      expect(value.projectId).toBe('');
    });

    it('patches the form with the issue values when opening in edit mode', () => {
      component.open(existingIssue);

      expect(component.isOpen()).toBe(true);
      expect(component.currentIssue()).toBe(existingIssue);
      expect(component.isEditMode()).toBe(true);

      const value = component.form.getRawValue();
      expect(value.title).toBe('Original title');
      expect(value.description).toBe('Original description');
      expect(value.priority).toBe(IssuePriority.HIGH);
      expect(value.status).toBe(IssueStatus.IN_PROGRESS);
      expect(value.assignee).toBe('auth0|dev');
      expect(value.projectId).toBe('proj-1');
    });
  });

  describe('submit', () => {
    it('does not call the facade and marks all controls as touched when the form is invalid', () => {
      component.open();

      component.submit();

      expect(issuesFacade.createIssue).not.toHaveBeenCalled();
      expect(component.form.get('title')?.touched).toBe(true);
      expect(component.form.get('description')?.touched).toBe(true);
    });

    it('creates the issue with the resolved assignee and refreshes both facades on success', () => {
      component.open();
      component.form.patchValue({
        title: 'New bug',
        description: 'Something is broken',
        assignee: 'auth0|dev',
        projectId: 'proj-1',
      });
      issuesFacade.createIssue.mockReturnValue(of({}));

      component.submit();

      expect(issuesFacade.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New bug',
          description: 'Something is broken',
          projectId: 'proj-1',
          assignee: { id: 'auth0|dev', dbId: 'db-dev', name: 'Dev' },
        }),
      );
      expect(notificationService.show).toHaveBeenCalledWith('Issue created successfully', 'success');
      expect(issuesFacade.refresh).toHaveBeenCalled();
      expect(projectsFacade.refresh).toHaveBeenCalled();
      expect(component.isOpen()).toBe(false);
      expect(component.loading()).toBe(false);
    });

    it('sends assignee null and projectId null when neither is selected', () => {
      component.open();
      component.form.patchValue({
        title: 'New bug',
        description: 'Something is broken',
        assignee: '',
        projectId: '',
      });
      issuesFacade.createIssue.mockReturnValue(of({}));

      component.submit();

      expect(issuesFacade.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          assignee: null,
          projectId: null,
        }),
      );
    });

    it('calls updateIssue with the issue id when editing an existing issue', () => {
      component.open(existingIssue);
      issuesFacade.updateIssue.mockReturnValue(of({}));

      component.submit();

      expect(issuesFacade.updateIssue).toHaveBeenCalledWith(
        'issue-1',
        expect.objectContaining({ title: 'Original title' }),
      );
      expect(issuesFacade.createIssue).not.toHaveBeenCalled();
      expect(notificationService.show).toHaveBeenCalledWith('Issue updated successfully', 'success');
    });

    it('keeps the modal open and sets the error message when the request fails', () => {
      component.open();
      component.form.patchValue({
        title: 'New bug',
        description: 'Something is broken',
      });
      issuesFacade.createIssue.mockReturnValue(throwError(() => new Error('Network error')));

      component.submit();

      expect(component.error()).toBe('Network error');
      expect(component.loading()).toBe(false);
      expect(component.isOpen()).toBe(true);
      expect(notificationService.show).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('does not close while a request is loading', () => {
      component.open();
      component.loading.set(true);

      component.close();

      expect(component.isOpen()).toBe(true);

      component.loading.set(false);
      component.close();

      expect(component.isOpen()).toBe(false);
      expect(component.currentIssue()).toBeNull();
    });
  });

  describe('isInvalid', () => {
    it('is false until the control has been touched', () => {
      component.open();
      expect(component.isInvalid('title')).toBe(false);
    });

    it('is true once an invalid control has been touched', () => {
      component.open();
      component.form.get('title')?.markAsTouched();
      expect(component.isInvalid('title')).toBe(true);
    });
  });

  describe('canAssign', () => {
    it('reflects the current user role', () => {
      meSignal.set({ role: 'tester' } as User);
      expect(component.canAssign()).toBe(false);

      meSignal.set({ role: 'developer' } as User);
      expect(component.canAssign()).toBe(true);

      meSignal.set({ role: 'admin' } as User);
      expect(component.canAssign()).toBe(true);
    });
  });
});
