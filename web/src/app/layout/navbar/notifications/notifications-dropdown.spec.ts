import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsDropdown } from './notifications-dropdown';

describe('NotificationsDropdown', () => {
  let component: NotificationsDropdown;
  let fixture: ComponentFixture<NotificationsDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsDropdown],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsDropdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
