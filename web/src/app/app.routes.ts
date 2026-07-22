import { Route } from '@angular/router';
import { MainLayout } from './layout/main-layout';
import { authGuard } from './core/guards/auth/auth-guard';
import { adminGuard } from './core/guards/admin/admin-guard';
import { publicGuard } from './core/guards/public/public-guard';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/public/public').then(m => m.PublicPage),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/users/users').then(m => m.UsersPage),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/projects/projects').then(m => m.ProjectsPage),
      },
      {
        path: 'issues',
        loadComponent: () =>
          import('./pages/issues/issues').then(m => m.IssuesPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
