export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartPayload {
  chartType: 'bar' | 'pie' | 'line';
  title: string;
  labels: string[];
  datasets: ChartDataset[];
}
