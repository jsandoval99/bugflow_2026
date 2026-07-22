import { Component, computed, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersFacade } from '@bugflow-2026/data-access';
import { UserRole } from '@bugflow-2026/shared-types';
import { LogoComponent } from '../../shared/ui/logo/logo';
import { NotificationsDropdown } from './notifications/notifications-dropdown';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, LogoComponent, NotificationsDropdown],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private usersFacade = inject(UsersFacade);

  user$ = this.auth.user$;
  currentUser = this.usersFacade.me;

  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);
  isDeveloper = computed(() => this.currentUser()?.role === UserRole.DEVELOPER);
  isTester = computed(() => this.currentUser()?.role === UserRole.TESTER);

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}
