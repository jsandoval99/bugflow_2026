import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UsersFacade, CommentsFacade } from '@bugflow-2026/data-access';
import { SocketService } from 'realtime/src/lib/socket.service';
import { CommentsComponent } from './comments';

describe('CommentsComponent', () => {
  let component: CommentsComponent;
  let fixture: ComponentFixture<CommentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentsComponent],
      providers: [
        {
          provide: UsersFacade,
          useValue: {
            me: signal(null),
          },
        },
        {
          provide: CommentsFacade,
          useValue: {
            commentsState: signal({
              data: [],
              loading: false,
              error: null,
            }),
            setIssue: jest.fn(),
            refresh: jest.fn(),
            createComment: jest.fn(() => of({})),
            updateComment: jest.fn(() => of({})),
            deleteComment: jest.fn(() => of({})),
          },
        },
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsComponent);

    fixture.componentRef.setInput(
      'issueId',
      'test-issue-id'
    );

    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
