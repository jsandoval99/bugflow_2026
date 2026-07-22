import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { UsersFacade } from '@bugflow-2026/data-access';
import { UserRole } from '@bugflow-2026/shared-types';

export const adminGuard: CanActivateFn = () => {
  const usersFacade = inject(UsersFacade);
  const router = inject(Router);

  return usersFacade.getMe().pipe(
    map(user => {
      if (user.role !== UserRole.ADMIN) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
  );
};
