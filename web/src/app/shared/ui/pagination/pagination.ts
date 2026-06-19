import { Component, input, output, computed, signal, HostListener } from '@angular/core';
import { PAGE_SIZE_OPTIONS } from '@bugflow-2026/shared-types';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.html',
})
export class PaginationComponent {
  page = input.required<number>();
  pageSize = input.required<number>();
  total = input.required<number>();
  totalPages = input.required<number>();
  pageSizeOptions = input<number[]>(PAGE_SIZE_OPTIONS);
  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly maxVisiblePages = signal(9);
  readonly startItem = computed(
    () => ((this.page() - 1) * this.pageSize()) + 1
  );
  readonly endItem = computed(
    () => Math.min(
      this.page() * this.pageSize(),
      this.total()
    )
  );
  readonly pages = computed(() =>
    Array.from(
      { length: this.totalPages() },
      (_, i) => i + 1
    )
  );
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const max = this.maxVisiblePages();

    if (total <= max) {
      return Array.from(
        { length: total },
        (_, i) => i + 1
      );
    }

    const half = Math.floor(max / 2);
    let start = current - half;
    let end = current + half;

    if (start < 1) {
      start = 1;
      end = max;
    }
    if (end > total) {
      end = total;
      start = total - max + 1;
    }

    return Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  });

  constructor() {
    this.updateViewport();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateViewport();
  }

  private updateViewport() {
    const width = window.innerWidth;
    if (width < 640) {
      this.maxVisiblePages.set(3);
      return;
    }
    if (width < 1024) {
      this.maxVisiblePages.set(5);
      return;
    }
    this.maxVisiblePages.set(9);
  }

  previous() {
    if (this.page() > 1) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  next() {
    if (this.page() < this.totalPages()) {
      this.pageChange.emit(this.page() + 1);
    }
  }

  goToPage(page: number) {
    this.pageChange.emit(page);
  }

  changePageSize(value: string) {
    this.pageSizeChange.emit(Number(value));
  }
}
