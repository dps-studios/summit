<script lang="ts">
  interface Props {
    score: number;
    size?: number;
    strokeWidth?: number;
  }

  let { score, size = 200, strokeWidth = 12 }: Props = $props();

  const radius = $derived((size - strokeWidth) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const progress = $derived((score / 100) * circumference);
  const offset = $derived(circumference - progress);

  // Color based on score
  const scoreColor = $derived(
    score >= 80 ? '#22c55e'  // Green - excellent
    : score >= 60 ? '#84cc16' // Lime - good
    : score >= 40 ? '#eab308' // Yellow - moderate
    : score >= 20 ? '#f97316' // Orange - low
    : '#ef4444'               // Red - poor
  );

  const scoreLabel = $derived(
    score >= 80 ? 'Excellent'
    : score >= 60 ? 'Good'
    : score >= 40 ? 'Moderate'
    : score >= 20 ? 'Low'
    : 'Rest'
  );
</script>

<div class="vital-ring" style="width: {size}px; height: {size}px;">
  <svg viewBox="0 0 {size} {size}">
    <!-- Background circle -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke="#374151"
      stroke-width={strokeWidth}
    />
    <!-- Progress circle -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={scoreColor}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
      transform="rotate(-90 {size / 2} {size / 2})"
      style="transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;"
    />
  </svg>
  <div class="score-content">
    <div class="score-value">{score}</div>
    <div class="score-label">{scoreLabel}</div>
  </div>
</div>

<style>
  .vital-ring {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  svg {
    position: absolute;
    top: 0;
    left: 0;
  }

  .score-content {
    text-align: center;
    z-index: 1;
  }

  .score-value {
    font-size: 3rem;
    font-weight: 800;
    color: #f9fafb;
    line-height: 1;
  }

  .score-label {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
