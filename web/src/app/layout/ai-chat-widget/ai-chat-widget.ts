import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, HostListener, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AiChatFacade } from '@bugflow-2026/data-access';
import { AiProvider } from '@bugflow-2026/shared-types';
import { ChartMessageComponent } from './chart-message/chart-message';

export interface MessageSegment {
  type: 'text' | 'issue-link';
  text: string;
  issueId?: string;
}

const ISSUE_LINK_PATTERN = /\[([^\]]+)\]\(issue:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g;

function extractMessageSegments(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  ISSUE_LINK_PATTERN.lastIndex = 0;
  while ((match = ISSUE_LINK_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'issue-link', text: match[1], issueId: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return segments;
}

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [ReactiveFormsModule, ChartMessageComponent],
  templateUrl: './ai-chat-widget.html',
})
export class AiChatWidgetComponent implements AfterViewChecked {
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;

  private fb = inject(FormBuilder).nonNullable;
  private router = inject(Router);
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

  parseMessageLines(content: string): MessageSegment[][] {
    return content.split('\n').map(line => extractMessageSegments(line));
  }

  isListLine(line: MessageSegment[]): boolean {
    return line[0]?.type === 'text' && line[0].text.trimStart().startsWith('- ');
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

  parseMessageSegments(content: string): MessageSegment[] {
    return extractMessageSegments(content);
  }

  openIssue(issueId: string) {
    this.router.navigate(['/issues'], {
      queryParams: { issueId },
      queryParamsHandling: 'merge',
    });
  }

  ngAfterViewChecked() {
    if (this.pendingScroll && this.scrollAnchor) {
      this.pendingScroll = false;
      this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
