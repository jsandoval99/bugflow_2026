import { Component, Input, WritableSignal } from '@angular/core';
import { IssueStatus, IssuePriority, Project, IssueFilters } from '@bugflow-2026/shared-types';

@Component({
  selector: 'app-issue-filters',
  standalone: true,
  templateUrl: './issue-filters.html',
})
export class IssueFiltersComponent {
  @Input({ required: true })
  issuesLength!: number;

  @Input({ required: true })
  projects!: Project[];

  @Input({ required: true })
  filters!: WritableSignal<IssueFilters>;

  statuses = Object.values(IssueStatus);
  priorities = Object.values(IssuePriority);

  updateStatus(value: string) {
    this.filters.update(f => ({
      ...f,
      status: value ? (value as IssueStatus) : '',
      page: 1,
    }));
  }

  updatePriority(value: string) {
    this.filters.update(f => ({
      ...f,
      priority: value ? (value as IssuePriority) : '',
      page: 1,
    }));
  }

  updateProject(value: string) {
    this.filters.update(f => ({
      ...f,
      projectId: value,
      page: 1,
    }));
  }

  updateSearch(value: string) {
    this.filters.update(f => ({
      ...f,
      search: value,
      page: 1,
    }));
  }

  clearFilters() {
    const currentPageSize = this.filters().pageSize;
    this.filters.set({
      status: '',
      priority: '',
      search: '',
      projectId: '',
      page: 1,
      pageSize: currentPageSize,
    });
  }
}
