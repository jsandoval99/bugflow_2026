import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsDropdown } from './notifications-dropdown';
import { SocketService } from 'realtime/src/lib/socket.service';
import { IssueWatchersApiFacade } from 'data-access/src/lib/issues/issue-watchers.facade';
import { NotificationsFacade } from 'data-access/src/lib/notifications/notifications.facade';

describe('NotificationsDropdown', () => {
  let component: NotificationsDropdown;
  let fixture: ComponentFixture<NotificationsDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsDropdown],
      providers: [
        {
          provide: SocketService,
          useValue: {
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
          },
        },
        {
          provide: IssueWatchersApiFacade,
          useValue: {
            isWatching: jest.fn(),
            watch: jest.fn(),
            unwatch: jest.fn(),
          },
        },
        {
          provide: NotificationsFacade,
          useValue: {
            notifications: signal([]),
            unreadCount: signal(0),
            load: jest.fn(),
            markAsRead: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsDropdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
