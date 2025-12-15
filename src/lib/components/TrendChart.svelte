<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  } from 'chart.js';
  import type { Timeframe } from '$lib/models/types';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  interface Props {
    labels: string[];
    values: number[];
    label: string;
    timeframe: Timeframe;
    color?: string;
    showBaseline?: boolean;
    baselineValue?: number;
  }

  let { 
    labels, 
    values, 
    label, 
    timeframe,
    color = '#3b82f6',
    showBaseline = true,
    baselineValue
  }: Props = $props();

  const baseline = $derived(
    baselineValue ?? (values.length > 0 ? values.slice(0, Math.ceil(values.length / 3)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 3) : 0)
  );

  const data = $derived({
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.3,
        pointRadius: timeframe === '1W' ? 4 : timeframe === '2W' ? 3 : 2,
        pointHoverRadius: 6,
      },
      ...(showBaseline ? [{
        label: 'Baseline',
        data: Array(labels.length).fill(baseline),
        borderColor: '#6b7280',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }] : [])
    ]
  });

  const options = $derived({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: timeframe === '1W' ? 7 : timeframe === '1M' ? 8 : 6,
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  });
</script>

<div class="chart-container">
  <Line {data} {options} />
</div>

<style>
  .chart-container {
    width: 100%;
    height: 200px;
  }
</style>
