import { Component, input, viewChild, ElementRef, effect, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartPayload } from '@bugflow-2026/shared-types';

Chart.register(...registerables);

const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#0891b2', '#ca8a04', '#db2777'];

@Component({
  selector: 'app-chart-message',
  standalone: true,
  templateUrl: './chart-message.html',
})
export class ChartMessageComponent implements OnDestroy {
  chart = input.required<ChartPayload>();
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      this.render(this.chart(), this.canvasRef().nativeElement);
    });
  }

  private render(payload: ChartPayload, canvas: HTMLCanvasElement) {
    this.chartInstance?.destroy();

    const isPie = payload.chartType === 'pie';
    const config: ChartConfiguration = {
      type: payload.chartType,
      data: {
        labels: payload.labels,
        datasets: payload.datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: isPie
            ? payload.labels.map((_, idx) => PALETTE[idx % PALETTE.length])
            : PALETTE[i % PALETTE.length],
          borderColor: isPie ? '#ffffff' : PALETTE[i % PALETTE.length],
          borderWidth: isPie ? 2 : 1,
          tension: payload.chartType === 'line' ? 0.3 : undefined,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isPie || payload.datasets.length > 1,
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          title: {
            display: !!payload.title,
            text: payload.title,
            font: { size: 12 },
          },
        },
        scales: isPie ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };

    this.chartInstance = new Chart(canvas, config);
  }

  ngOnDestroy() {
    this.chartInstance?.destroy();
  }
}
