import { switchMap, map, startWith } from 'rxjs';
import { inject, Injectable, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { SocketService } from '@bugflow-2026/realtime';
import { DashboardApi } from './dashboard.api';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private api = inject(DashboardApi);
  private socket = inject(SocketService);
  private refreshTrigger = signal(1);

  readonly statsState = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() =>
        this.api.getStats().pipe(
          map(data => ({
            data,
            loading: false,
          })),
          startWith({
            data: null,
            loading: true,
          })
        )
      )
    ),
    {
      initialValue: {
        data: null,
        loading: true,
      },
    }
  );

  constructor() {
    this.socket.onIssueCreated(() => this.refresh());
    this.socket.onIssueUpdated(() => this.refresh());
    this.socket.onIssueDeleted(() => this.refresh());
  }

  refresh() {
    this.refreshTrigger.update(v => v + 1);
  }
}
