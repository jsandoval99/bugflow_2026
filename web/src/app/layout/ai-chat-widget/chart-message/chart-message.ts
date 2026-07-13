import { Component, input, viewChild, ElementRef, effect, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, Plugin, registerables } from 'chart.js';
import { ChartPayload } from '@bugflow-2026/shared-types';

Chart.register(...registerables);

const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#0891b2', '#ca8a04', '#db2777'];
const valueLabelsPlugin: Plugin = {
  id: 'valueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (value === null || value === undefined) return;

        const { x = 0, y = 0 } = element.tooltipPosition(true) || {};
        const px = x !== null ? x : 0;
        const py = y !== null ? y : 0;

        ctx.save();
        ctx.fillStyle = '#374151';
        ctx.font = '600 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(value), px, py - 6);
        ctx.restore();
      });
    });
  },
};

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
    const total = payload.datasets[0]?.data.reduce((sum, v) => sum + v, 0) ?? 0;

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
        layout: { padding: { top: 6 } },
        plugins: {
          legend: {
            display: isPie || payload.datasets.length > 1,
            labels: {
              boxWidth: 12,
              font: { size: 11 },
              generateLabels: isPie
                ? chart => {
                    const data = chart.data.datasets[0]?.data as number[];
                    return (chart.data.labels as string[]).map((label, i) => {
                      const value = data[i];
                      const pct = total ? Math.round((value / total) * 100) : 0;
                      return {
                        text: `${label}: ${value} (${pct}%)`,
                        fillStyle: PALETTE[i % PALETTE.length],
                        strokeStyle: '#ffffff',
                        index: i,
                      };
                    });
                  }
                : undefined,
            },
          },
          title: {
            display: !!payload.title,
            text: payload.title,
            font: { size: 12 },
            padding: { bottom: 24 },
          },
        },
        scales: isPie ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
      plugins: [valueLabelsPlugin],
    };

    this.chartInstance = new Chart(canvas, config);
  }

  ngOnDestroy() {
    this.chartInstance?.destroy();
  }
}
