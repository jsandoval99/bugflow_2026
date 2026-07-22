import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, catchError, of } from 'rxjs';
import { UsersFacade } from '@bugflow-2026/data-access';
import { User, UserRole } from '@bugflow-2026/shared-types';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';

interface UsersState {
  data: User[];
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CardComponent, SpinnerComponent],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersPage {
  private usersFacade = inject(UsersFacade);

  readonly usersState = toSignal(
    this.usersFacade.getAllUsers().pipe(
      map((data): UsersState => ({ data, loading: false, error: null })),
      startWith<UsersState>({ data: [], loading: true, error: null }),
      catchError(() =>
        of<UsersState>({
          data: [],
          loading: false,
          error: 'No se pudo cargar la lista de usuarios.',
        }),
      ),
    ),
    {
      initialValue: { data: [], loading: true, error: null } as UsersState,
    },
  );

  roleClasses(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-700';
      case UserRole.DEVELOPER:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  }
}
