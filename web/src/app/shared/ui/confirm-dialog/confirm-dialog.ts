import { Component, inject, HostListener } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialogComponent {
  private service = inject(ConfirmDialogService);
  readonly state = this.service.state;

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.state()) this.cancel();
  }

  confirm() {
    this.service.respond(true);
  }

  cancel() {
    this.service.respond(false);
  }
}
