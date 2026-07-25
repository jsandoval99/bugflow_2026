import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/ui/toast/toast';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog';
import { SocketService } from '@bugflow-2026/realtime';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  private socketService = inject(SocketService);
  constructor() {
    this.socketService.connect();
  }
}
