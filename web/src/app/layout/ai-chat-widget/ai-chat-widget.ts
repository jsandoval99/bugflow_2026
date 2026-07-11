import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, HostListener, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiChatFacade } from '@bugflow-2026/data-access';
import { AiProvider } from '@bugflow-2026/shared-types';
import { ChartMessageComponent } from './chart-message/chart-message';

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [ReactiveFormsModule, ChartMessageComponent],
  templateUrl: './ai-chat-widget.html',
})
export class AiChatWidgetComponent implements AfterViewChecked {
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;

  private fb = inject(FormBuilder).nonNullable;
  readonly facade = inject(AiChatFacade);

  open = signal(false);
  private pendingScroll = false;

  form = this.fb.group({
    message: this.fb.control('', Validators.required),
  });

  constructor() {
    effect(() => {
      this.facade.messages();
      this.pendingScroll = true;
    });
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.open()) this.open.set(false);
  }

  toggle() {
    this.open.update(v => !v);
  }

  selectProvider(provider: AiProvider) {
    if (this.facade.loading()) return;
    this.facade.setProvider(provider);
  }

  submit() {
    if (this.form.invalid) return;
    const { message } = this.form.getRawValue();
    this.facade.sendMessage(message);
    this.form.reset({ message: '' });
  }

  clear() {
    this.facade.clear();
  }

  ngAfterViewChecked() {
    if (this.pendingScroll && this.scrollAnchor) {
      this.pendingScroll = false;
      this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
