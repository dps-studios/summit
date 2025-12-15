<script lang="ts">
  import SparkLine from './SparkLine.svelte';
  import type { TrendDirection } from '$lib/models/types';

  interface Props {
    label: string;
    value: number | string;
    unit?: string;
    change?: number;
    direction?: TrendDirection;
    sparklineData?: number[];
  }

  let { label, value, unit = '', change, direction, sparklineData }: Props = $props();

  const changeColor = $derived(
    direction === 'improving' ? 'text-green-500' 
    : direction === 'declining' ? 'text-red-500' 
    : 'text-gray-500'
  );

  const changeIcon = $derived(
    direction === 'improving' ? '^' 
    : direction === 'declining' ? 'v' 
    : '-'
  );
</script>

<div class="metric-card">
  <div class="header">
    <span class="label">{label}</span>
    {#if change !== undefined}
      <span class="change {changeColor}">
        {changeIcon} {Math.abs(change).toFixed(1)}%
      </span>
    {/if}
  </div>
  
  <div class="value">
    {value}<span class="unit">{unit}</span>
  </div>

  {#if sparklineData && sparklineData.length > 0}
    <div class="sparkline-wrapper">
      <SparkLine values={sparklineData} color="auto" />
    </div>
  {/if}
</div>

<style>
  .metric-card {
    background: #1f2937;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .change {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .text-green-500 { color: #22c55e; }
  .text-red-500 { color: #ef4444; }
  .text-gray-500 { color: #6b7280; }

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #f9fafb;
  }

  .unit {
    font-size: 1rem;
    color: #9ca3af;
    margin-left: 4px;
  }

  .sparkline-wrapper {
    margin-top: 8px;
  }
</style>
