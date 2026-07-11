import { inject, Injectable } from '@angular/core';
import { IssueWatchersApiService } from './issue-watchers.api';

@Injectable({ providedIn: 'root' })
export class IssueWatchersApiFacade {
  private api = inject(IssueWatchersApiService);

  isWatching(issueId: string) {
    return this.api.isWatching(issueId);
  }

  watch(issueId: string) {
    return this.api.watch(issueId);
  }

  unwatch(issueId: string) {
    return this.api.unwatch(issueId);
  }

}
