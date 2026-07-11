import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  user$ = this.auth.user$;
  isAdmin = true;
  isDeveloper = true;
  isTester = false;

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}
