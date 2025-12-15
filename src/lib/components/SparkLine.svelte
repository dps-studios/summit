<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement
  } from 'chart.js';

  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

  interface Props {
    values: number[];
    color?: string;
    height?: number;
  }

  let { values, color = '#3b82f6', height = 40 }: Props = $props();

  // Determine trend direction for color
  const trend = $derived(() => {
    if (values.length < 2) return 'stable';
    const first = values.slice(0, Math.ceil(values.length / 3));
    const last = values.slice(-Math.ceil(values.length / 3));
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
    const change = ((lastAvg - firstAvg) / firstAvg) * 100;
    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  });

  const lineColor = $derived(
    color === 'auto' 
      ? trend() === 'up' ? '#22c55e' : trend() === 'down' ? '#ef4444' : '#6b7280'
      : color
  );

  const data = $derived({
    labels: values.map((_, i) => i.toString()),
    datasets: [{
      data: values,
      borderColor: lineColor,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    }]
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };
</script>

<div class="sparkline" style="height: {height}px;">
  <Line {data} {options} />
</div>

<style>
  .sparkline {
    width: 100%;
  }
</style>
