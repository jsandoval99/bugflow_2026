import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, switchMap } from 'rxjs';
import { CreateProjectPayload, UpdateProjectPayload } from '@bugflow-2026/shared-types';
import { ProjectsApiService } from './projects.api';

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
  private api = inject(ProjectsApiService);
  private refreshTrigger = signal(0);
  readonly projectsState = toSignal(
    toObservable(
      computed(() => ({
        refresh: this.refreshTrigger(),
      }))
    ).pipe(
      switchMap(() =>
        this.api.getProjects().pipe(
          map(data => ({
            data,
            loading: false,
          })),
          startWith({
            data: [],
            loading: true,
          })
        )
      )
    ),
    {
      initialValue: {
        data: [],
        loading: true,
      },
    }
  );

  refresh() {
    this.refreshTrigger.update(v => v + 1);
  }

  createProject(data: CreateProjectPayload) {
    return this.api.createProject(data);
  }

  updateProject(
    id: string,
    data: UpdateProjectPayload,
  ) {
    return this.api.updateProject(id, data);
  }

  deleteProject(id: string) {
    return this.api.deleteProject(id);
  }
}
