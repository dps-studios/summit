/**
 * Trend detection and analysis
 * Core differentiator: multi-timeframe trajectory analysis
 */

import type { 
  HealthMetrics, 
  Trend, 
  TrendMetric, 
  Timeframe, 
  TrendDirection,
  TrendInsight 
} from '../models/types';

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '1W': 7,
  '2W': 14,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};

// Threshold for significant change (percentage)
const SIGNIFICANCE_THRESHOLD = 10;

/**
 * Analyze trends for a specific metric across all timeframes
 */
export function analyzeTrends(
  metrics: HealthMetrics[],
  metric: TrendMetric
): Trend[] {
  const trends: Trend[] = [];
  
  for (const timeframe of Object.keys(TIMEFRAME_DAYS) as Timeframe[]) {
    const trend = calculateTrend(metrics, metric, timeframe);
    if (trend) {
      trends.push(trend);
    }
  }
  
  return trends;
}

/**
 * Calculate trend for a single metric/timeframe combination
 */
export function calculateTrend(
  metrics: HealthMetrics[],
  metric: TrendMetric,
  timeframe: Timeframe
): Trend | null {
  const days = TIMEFRAME_DAYS[timeframe];
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Filter to timeframe
  const relevantMetrics = metrics.filter(m => new Date(m.date) >= cutoff);
  
  if (relevantMetrics.length < 3) {
    return null; // Not enough data
  }

  const values = extractMetricValues(relevantMetrics, metric);
  if (values.length < 3) {
    return null;
  }

  // Calculate baseline (first third of period) vs current (last third)
  const thirdLength = Math.floor(values.length / 3);
  const baselineValues = values.slice(0, thirdLength);
  const currentValues = values.slice(-thirdLength);

  const baseline = average(baselineValues);
  const currentAvg = average(currentValues);
  
  if (baseline === 0) {
    return null; // Avoid division by zero
  }

  const percentChange = ((currentAvg - baseline) / baseline) * 100;
  const direction = getDirection(percentChange, metric);

  return {
    metric,
    timeframe,
    baseline,
    currentAvg,
    percentChange,
    direction,
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Extract numeric values for a specific metric
 */
function extractMetricValues(metrics: HealthMetrics[], metric: TrendMetric): number[] {
  const fieldMap: Record<TrendMetric, keyof HealthMetrics> = {
    'body_battery': 'bodyBattery',
    'sleep_score': 'sleepScore',
    'sleep_duration': 'sleepDurationSeconds',
    'deep_sleep': 'deepSleepSeconds',
    'rem_sleep': 'remSleepSeconds',
    'stress': 'stressAvg',
    'resting_hr': 'restingHr',
    'hrv': 'hrvAvg',
    'intensity_minutes': 'intensityMinutes',
    'steps': 'steps',
  };

  const field = fieldMap[metric];
  return metrics
    .map(m => m[field] as number | undefined)
    .filter((v): v is number => v !== undefined && v !== null);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Determine trend direction based on percent change
 * Note: For some metrics (stress, resting HR), lower is better
 */
function getDirection(percentChange: number, metric: TrendMetric): TrendDirection {
  const invertedMetrics: TrendMetric[] = ['stress', 'resting_hr'];
  const isInverted = invertedMetrics.includes(metric);
  
  const effectiveChange = isInverted ? -percentChange : percentChange;
  
  if (effectiveChange > SIGNIFICANCE_THRESHOLD) {
    return 'improving';
  }
  if (effectiveChange < -SIGNIFICANCE_THRESHOLD) {
    return 'declining';
  }
  return 'stable';
}

/**
 * Generate human-readable insight from a trend
 */
export function generateInsight(trend: Trend): TrendInsight {
  const metricLabels: Record<TrendMetric, string> = {
    'body_battery': 'Body Battery',
    'sleep_score': 'sleep quality',
    'sleep_duration': 'sleep duration',
    'deep_sleep': 'deep sleep',
    'rem_sleep': 'REM sleep',
    'stress': 'stress levels',
    'resting_hr': 'resting heart rate',
    'hrv': 'heart rate variability',
    'intensity_minutes': 'activity intensity',
    'steps': 'daily steps',
  };

  const timeframeLabels: Record<Timeframe, string> = {
    '1W': 'the past week',
    '2W': 'the past 2 weeks',
    '1M': 'the past month',
    '3M': 'the past 3 months',
    '6M': 'the past 6 months',
    '1Y': 'the past year',
  };

  const label = metricLabels[trend.metric];
  const timeLabel = timeframeLabels[trend.timeframe];
  const changeDir = trend.percentChange > 0 ? 'increased' : 'decreased';
  const absChange = Math.abs(Math.round(trend.percentChange));

  return {
    metric: trend.metric,
    timeframe: trend.timeframe,
    percentChange: trend.percentChange,
    direction: trend.direction,
    summary: `Your ${label} has ${changeDir} ${absChange}% over ${timeLabel}.`,
    whyItMatters: getWhyItMatters(trend.metric, trend.direction),
    strategies: getStrategies(trend.metric, trend.direction),
  };
}

function getWhyItMatters(metric: TrendMetric, direction: TrendDirection): string {
  if (direction === 'stable') {
    return 'This metric is holding steady - consistency is good.';
  }

  const matters: Record<TrendMetric, { improving: string; declining: string }> = {
    'body_battery': {
      improving: 'Higher energy reserves mean better workout capacity and mental clarity.',
      declining: 'Declining energy reserves may indicate overtraining or insufficient recovery.',
    },
    'sleep_score': {
      improving: 'Better sleep quality enhances recovery, cognitive function, and immune health.',
      declining: 'Reduced sleep quality impacts recovery, mood, and long-term health.',
    },
    'sleep_duration': {
      improving: 'Adequate sleep duration supports physical recovery and mental performance.',
      declining: 'Insufficient sleep accumulates as sleep debt, affecting all aspects of health.',
    },
    'deep_sleep': {
      improving: 'Deep sleep is when physical recovery and memory consolidation occur.',
      declining: 'Less deep sleep means reduced physical recovery and potential cognitive impacts.',
    },
    'rem_sleep': {
      improving: 'REM sleep supports emotional regulation and learning.',
      declining: 'Reduced REM can affect mood, creativity, and memory.',
    },
    'stress': {
      improving: 'Lower chronic stress supports better recovery and overall health.',
      declining: 'Elevated stress increases cortisol, impairing recovery and immune function.',
    },
    'resting_hr': {
      improving: 'A lower resting HR often indicates improved cardiovascular fitness.',
      declining: 'Elevated resting HR can signal overtraining, stress, or illness.',
    },
    'hrv': {
      improving: 'Higher HRV indicates better autonomic balance and recovery capacity.',
      declining: 'Lower HRV suggests accumulated stress or insufficient recovery.',
    },
    'intensity_minutes': {
      improving: 'More activity supports cardiovascular health and energy levels.',
      declining: 'Reduced activity may impact fitness maintenance and energy.',
    },
    'steps': {
      improving: 'Increased movement supports metabolic health and energy.',
      declining: 'Reduced movement can impact circulation and energy levels.',
    },
  };

  return matters[metric][direction];
}

function getStrategies(metric: TrendMetric, direction: TrendDirection): string[] {
  if (direction !== 'declining') {
    return ['Keep doing what you\'re doing - it\'s working.'];
  }

  const strategies: Record<TrendMetric, string[]> = {
    'body_battery': [
      'Schedule a rest day or deload week',
      'Check sleep consistency',
      'Review training load - may need to reduce volume',
    ],
    'sleep_score': [
      'Set a consistent bedtime',
      'Reduce screen time 1 hour before bed',
      'Check bedroom temperature (65-68°F ideal)',
      'Limit caffeine after 2pm',
    ],
    'sleep_duration': [
      'Set a non-negotiable bedtime',
      'Create a wind-down routine',
      'Audit evening commitments',
    ],
    'deep_sleep': [
      'Avoid alcohol close to bedtime',
      'Exercise earlier in the day',
      'Keep bedroom cool and dark',
    ],
    'rem_sleep': [
      'Reduce alcohol intake',
      'Address sources of anxiety/stress',
      'Maintain consistent wake time',
    ],
    'stress': [
      'Add 10 minutes of daily breathwork',
      'Review workload and commitments',
      'Consider meditation or journaling',
      'Prioritize social connection',
    ],
    'resting_hr': [
      'Check for signs of overtraining',
      'Ensure adequate hydration',
      'Review recent illness or stress',
      'Consider a recovery week',
    ],
    'hrv': [
      'Prioritize sleep quality',
      'Reduce training intensity temporarily',
      'Check hydration and nutrition',
      'Add recovery modalities (stretching, massage)',
    ],
    'intensity_minutes': [
      'Schedule workouts like appointments',
      'Start with short sessions (even 10 min helps)',
      'Find activities you enjoy',
    ],
    'steps': [
      'Take walking meetings',
      'Set hourly movement reminders',
      'Park farther away',
      'Use stairs instead of elevators',
    ],
  };

  return strategies[metric];
}

/**
 * Detect significant shifts that warrant alerting the user
 */
export function detectSignificantShifts(trends: Trend[]): TrendInsight[] {
  return trends
    .filter(t => t.direction === 'declining' && Math.abs(t.percentChange) > SIGNIFICANCE_THRESHOLD)
    .map(generateInsight)
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
}
