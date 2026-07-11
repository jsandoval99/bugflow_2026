import { Component, inject, signal, HostListener, computed, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { IssuesFacade, ProjectsFacade, UsersFacade } from '@bugflow-2026/data-access';
import { Issue, IssuePriority, IssueStatus, User, enumToOptions } from '@bugflow-2026/shared-types';
import { SelectComponent, SelectOption } from '../../../../shared/ui/select/select';
import { NotificationService } from '../../../../core/services/notification.service/notification.service';

@Component({
  selector: 'app-create-issue-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SelectComponent,
    CdkTrapFocus,
  ],
  templateUrl: './create-issue-modal.html',
})
export class CreateIssueModalComponent implements AfterViewChecked {
  @ViewChild('titleInput')
  titleInputRef!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder).nonNullable;
  private facade = inject(IssuesFacade);
  private notification = inject(NotificationService);
  private usersFacade = inject(UsersFacade);
  private projectsFacade = inject(ProjectsFacade);
  private pendingFocus = false;

  readonly IssueStatus = IssueStatus;
  readonly IssuePriority = IssuePriority;
  readonly statusOptions: SelectOption[] = enumToOptions(IssueStatus);
  readonly priorityOptions: SelectOption[] = enumToOptions(IssuePriority);

  users = signal<User[]>([]);
  currentUser = this.usersFacade.me;
  currentIssue = signal<Issue | null>(null);
  isEditMode = computed(() => !!this.currentIssue());
  projects = computed(() =>
    this.projectsFacade.projectsState().data
  );
  projectOptions = computed(() => [
    {
      label: 'No project',
      value: '',
    },
    ...this.projects().map(project => ({
      label: project.name,
      value: project.id,
    }))
  ]);
  assigneeOptions = computed(() =>
    this.users().map(u => ({
      label: u.name,
      value: u.auth0Id,
      dbId: u.id,
    }))
  );
  canAssign = computed(() => {
    const user = this.currentUser();
    return user?.role === 'admin' || user?.role === 'developer';
  });

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (!this.isOpen() || this.loading()) return;
    this.close();
  }

  isOpen = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    title: this.fb.control('', Validators.required),
    description: this.fb.control('', Validators.required),
    priority: this.fb.control(IssuePriority.MEDIUM),
    status: this.fb.control(IssueStatus.OPEN),
    assignee: this.fb.control(''),
    projectId: this.fb.control(''),
  });

  ngAfterViewChecked() {
    if (this.pendingFocus && this.titleInputRef.nativeElement) {
      this.pendingFocus = false;
      setTimeout(() => {
        this.titleInputRef.nativeElement.focus();
      }, 200);
    }
  }

  open(issue?: Issue) {
    document.body.style.overflow = 'hidden';
    this.currentIssue.set(issue ?? null);
    this.usersFacade.getAssignableUsers().subscribe(users => {
      this.users.set(users);
    });

    if (issue) {
      this.form.patchValue({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        assignee: issue.assignee?.id || '',
        projectId: issue.projectId || '',
      });
    } else {
      this.form.reset({
        priority: IssuePriority.MEDIUM,
        status: IssueStatus.OPEN,
        projectId: '',
      });
    }

    this.pendingFocus = true;
    this.isOpen.set(true);
  }

  close() {
    document.body.style.overflow = '';
    if (!this.isOpen() || this.loading()) return;
    this.isOpen.set(false);
    this.currentIssue.set(null);
    this.form.reset({
      priority: IssuePriority.MEDIUM,
      status: IssueStatus.OPEN,
      projectId: '',
    });
    this.error.set(null);
  }

  isInvalid(controlName: keyof typeof this.form.controls) {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const assignee = this.assigneeOptions()
        .find(assignee => assignee.value === rawValue.assignee) || null;
    const value = {
      ...rawValue,
      projectId: rawValue.projectId || null,
      assignee: assignee ? {
        id: assignee.value,
        dbId: assignee.dbId,
        name: assignee.label
      } : null
    };
    const issue = this.currentIssue();

    this.loading.set(true);
    this.error.set(null);
    this.form.disable();

    const request$ = issue
      ? this.facade.updateIssue(issue.id, value)
      : this.facade.createIssue(value);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.form.enable();
        this.close();
        this.notification.show(
          issue ? 'Issue updated successfully' : 'Issue created successfully',
          'success'
        );
        this.facade.refresh();
        this.projectsFacade.refresh();
      },
      error: (err) => {
        this.loading.set(false);
        this.form.enable();
        this.error.set(err.message || 'Error saving issue');
      },
    });
  }
}
