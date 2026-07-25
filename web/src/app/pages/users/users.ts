import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith, catchError, of } from 'rxjs';
import { UsersFacade } from '@bugflow-2026/data-access';
import { User, UserRole, enumToOptions } from '@bugflow-2026/shared-types';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { NotificationService } from '../../core/services/notification.service/notification.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';

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
  private notification = inject(NotificationService);
  private confirmDialog = inject(ConfirmDialogService);

  private refreshTrigger = signal(0);
  currentUser = this.usersFacade.me;
  readonly roleOptions = enumToOptions(UserRole);

  editingUserId = signal<string | null>(null);
  savingUserId = signal<string | null>(null);

  readonly usersState = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() =>
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

  isSelf(user: User): boolean {
    return user.id === this.currentUser()?.id;
  }

  startEdit(user: User) {
    if (this.isSelf(user) || this.savingUserId()) return;
    this.editingUserId.set(user.id);
  }

  cancelEdit() {
    this.editingUserId.set(null);
  }

  async changeRole(user: User, value: string) {
    const newRole = value as UserRole;

    if (newRole === user.role) {
      this.editingUserId.set(null);
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Change role',
      message: `Change ${user.name}'s role to "${newRole}"?`,
    });

    if (!confirmed) {
      this.editingUserId.set(null);
      return;
    }

    this.savingUserId.set(user.id);
    this.usersFacade.updateRole(user.id, newRole).subscribe({
      next: () => {
        this.savingUserId.set(null);
        this.editingUserId.set(null);
        this.notification.show(`Role updated for ${user.name}`, 'success');
        this.refreshTrigger.update(v => v + 1);
      },
      error: () => {
        this.savingUserId.set(null);
        this.editingUserId.set(null);
        this.notification.show('Unable to update the user role.', 'error');
      },
    });
  }
}
