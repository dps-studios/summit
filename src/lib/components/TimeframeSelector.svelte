<script lang="ts">
  import type { Timeframe } from '$lib/models/types';

  interface Props {
    selected: Timeframe;
    onSelect: (timeframe: Timeframe) => void;
  }

  let { selected, onSelect }: Props = $props();

  const timeframes: { value: Timeframe; label: string }[] = [
    { value: '1W', label: '1W' },
    { value: '2W', label: '2W' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
  ];
</script>

<div class="timeframe-selector">
  {#each timeframes as tf}
    <button
      class="tf-button"
      class:active={selected === tf.value}
      onclick={() => onSelect(tf.value)}
    >
      {tf.label}
    </button>
  {/each}
</div>

<style>
  .timeframe-selector {
    display: flex;
    gap: 4px;
    background: #1f2937;
    padding: 4px;
    border-radius: 8px;
  }

  .tf-button {
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tf-button:hover {
    color: #f9fafb;
    background: #374151;
  }

  .tf-button.active {
    background: #3b82f6;
    color: #ffffff;
  }
</style>
