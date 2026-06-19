import { Component, inject, effect, ViewChild, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IssuesFacade, ProjectsFacade, UsersFacade } from '@bugflow-2026/data-access';
import { IssueStatus, IssuePriority, Issue, UserRole, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@bugflow-2026/shared-types';
import { IssueFiltersComponent } from './components/issue-filters/issue-filters';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { CreateIssueModalComponent } from './components/create-issue-modal/create-issue-modal';
import { ContextMenuComponent } from '../../shared/ui/context-menu/context-menu';
import { IssueDetailsModalComponent } from './components/issue-details-modal/issue-details-modal';
import { PaginationComponent } from '../../shared/ui/pagination/pagination';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.html',
  imports: [
    IssueFiltersComponent,
    SpinnerComponent,
    CardComponent,
    BadgeComponent,
    CreateIssueModalComponent,
    ContextMenuComponent,
    IssueDetailsModalComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssuesPage {
  @ViewChild(CreateIssueModalComponent)
  modal!: CreateIssueModalComponent;

  @ViewChild(IssueDetailsModalComponent)
  detailsModal!: IssueDetailsModalComponent;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersFacade = inject(UsersFacade);
  private defaultPageSize = DEFAULT_PAGE_SIZE;

  readonly projectsFacade = inject(ProjectsFacade);
  readonly facade = inject(IssuesFacade);
  readonly pageSizes = PAGE_SIZE_OPTIONS;
  readonly initFromQueryParams = (() => {
    const params = this.route.snapshot.queryParams;
    const hasQueryParams = Object.keys(params).length > 0;

    if (hasQueryParams) {
      this.facade.setFilters({
        status: (params['status'] as IssueStatus) || '',
        priority: (params['priority'] as IssuePriority) || '',
        search: params['search'] || '',
        projectId: params['projectId'] || '',
        page: Number(params['page']) || 1,
        pageSize: Number(params['pageSize']) || this.defaultPageSize,
      });
    }
  })();
  readonly syncFiltersToUrl = effect(() => {
    const { status, priority, search, projectId, page, pageSize } = this.facade.filtersState();
    const current = this.route.snapshot.queryParams;

    if (
      current['status'] === status &&
      current['priority'] === priority &&
      current['search'] === search &&
      current['projectId'] === projectId &&
      Number(current['page']) === page &&
      Number(current['pageSize']) === pageSize
    ) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: status || null,
        priority: priority || null,
        search: search || null,
        projectId: projectId || null,
        page,
        pageSize,
      },
      queryParamsHandling: 'merge',
    });
  });

  currentUser = this.usersFacade.me;
  canAssign = computed(() => {
    const role = this.currentUser()?.role;
    return role === UserRole.DEVELOPER || role === UserRole.TESTER;
  });

  openCreateModal() {
    this.modal.open();
  }

  openDetails(issue: Issue) {
    this.detailsModal.open(issue);
  }

  openEditModal(issue: Issue) {
    this.modal.open(issue);
  }

  deleteIssue(issue: Issue) {
    if (!confirm(`Delete "${issue.title}"?`)) return;
    // pending api connection
  }

  assignToMe(issue: Issue) {
    const user = this.currentUser();

    if (!user) return;
    if (!confirm(`Assign "${issue.title}" to you?`)) return;
    
    this.facade
      .updateIssue(issue.id, { assignee: { id: user.auth0Id, name: user.name } })
      .subscribe(() => {
        this.facade.refresh();
        this.projectsFacade.refresh();
      });
  }

  getMenuItems(issue: Issue) {
    const items = [
      {
        label: 'Edit',
        action: () => this.openEditModal(issue),
      },
      {
        label: 'Delete',
        action: () => this.deleteIssue(issue),
        danger: true,
      },
    ];

    if (this.canAssign() && issue.assignee !== this.currentUser()?.auth0Id) {
      items.splice(1, 0, {
        label: 'Assign to me',
        action: () => this.assignToMe(issue),
      });
    }

    return items;
  }

  updatePage(page: number) {
    this.facade.filtersState.update(f => ({
      ...f,
      page,
    }));
  }

  updatePageSize(pageSize: number) {
    this.facade.filtersState.update(f => ({
      ...f,
      page: 1,
      pageSize,
    }));
  }
}
