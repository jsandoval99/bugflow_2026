import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { switchMap, map, startWith } from 'rxjs';
import { IssueStatus, IssuePriority, CreateIssuePayload, UpdateIssuePayload, IssueFilters, PaginatedResponse, Issue, DEFAULT_PAGE_SIZE } from '@bugflow-2026/shared-types';
import { SocketService } from '@bugflow-2026/realtime';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { IssuesApiService } from './issues.api';

const STORAGE_KEY = 'bugflow-issues-filters';
const DEFAULT_FILTERS: IssueFilters = {
  status: '' as IssueStatus | '',
  priority: '' as IssuePriority | '',
  search: '',
  projectId: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};
const EMPTY_PAGE: PaginatedResponse<Issue> = {
  data: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 0,
};

@Injectable({ providedIn: 'root' })
export class IssuesFacade {
  private api = inject(IssuesApiService);
  private socketService = inject(SocketService);
  private refreshTrigger = signal(0);
  private filters = signal(this.loadInitialFilters());
  readonly filtersState = this.filters;
  readonly issuesState = toSignal(
    toObservable(
      computed(() => ({
        filters: this.filters(),
        refresh: this.refreshTrigger(),
      }))
    ).pipe(
      switchMap(({ filters }) =>
        this.api.getIssues(filters).pipe(
          map(data => ({ data, loading: false })),
          startWith({
            data: EMPTY_PAGE,
            loading: true,
          })
        )
      )
    ),
    { initialValue: {
      data: EMPTY_PAGE,
      loading: true,
    } }
  );

  constructor() {
    this.socketService.joinIssues();
    this.listenRealtime();

    effect(() => {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.filters())
      );
    });
  }

  private listenRealtime() {
    this.socketService.onIssueCreated(() => {
      this.refresh();
    });

    this.socketService.onIssueUpdated(() => {
      this.refresh();
    });
  }

  private loadInitialFilters(): IssueFilters {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_FILTERS;
    }

    try {
      return {
        ...DEFAULT_FILTERS,
        ...JSON.parse(saved),
      };
    } catch {
      return DEFAULT_FILTERS;
    }
  }

  refresh() {
    this.refreshTrigger.update(v => v + 1);
  }

  setFilters(filters: IssueFilters) {
    this.filters.set(filters);
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

  createIssue(data: CreateIssuePayload) {
    return this.api.createIssue(data);
  }

  updateIssue(id: string, data: UpdateIssuePayload) {
    return this.api.updateIssue(id, data);
  }

  loadIssuesOnce() {
    if (this.issuesState().data.data.length) return;
    this.refresh();
  }

  getIssue(id: string) {
    return this.api.getIssue(id);
  }

}
