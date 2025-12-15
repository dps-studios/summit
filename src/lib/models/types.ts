/**
 * Core data models for Summit
 * All health metrics and computed scores
 */

export interface HealthMetrics {
  id?: number;
  date: string; // ISO date string YYYY-MM-DD
  bodyBattery?: number; // 0-100
  sleepScore?: number; // 0-100
  sleepDurationSeconds?: number;
  deepSleepSeconds?: number;
  remSleepSeconds?: number;
  stressAvg?: number; // 0-100
  restingHr?: number;
  hrvAvg?: number;
  intensityMinutes?: number;
  steps?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VitalScore {
  id?: number;
  date: string;
  score: number; // 0-100
  sleepComponent: number;
  recoveryComponent: number;
  strainComponent: number;
  recommendation?: string;
  createdAt?: string;
}

export interface Trend {
  id?: number;
  metric: TrendMetric;
  timeframe: Timeframe;
  baseline: number;
  currentAvg: number;
  percentChange: number;
  direction: TrendDirection;
  detectedAt?: string;
}

export type Timeframe = '1W' | '2W' | '1M' | '3M' | '6M' | '1Y';

export type TrendMetric =
  | 'body_battery'
  | 'sleep_score'
  | 'sleep_duration'
  | 'deep_sleep'
  | 'rem_sleep'
  | 'stress'
  | 'resting_hr'
  | 'hrv'
  | 'intensity_minutes'
  | 'steps';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface TrendInsight {
  metric: TrendMetric;
  timeframe: Timeframe;
  percentChange: number;
  direction: TrendDirection;
  summary: string; // "Your deep sleep has dropped 18% over 3 weeks"
  whyItMatters: string; // "Declining deep sleep impacts recovery..."
  strategies: string[]; // ["Earlier bedtime", "Reduce screen time", ...]
}

export interface DailyBrief {
  date: string;
  vitalScore: VitalScore;
  recommendation: string;
  activeInsights: TrendInsight[];
}

/**
 * Export formats supported by Summit
 */
export type ExportFormat = 'json' | 'csv' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  includeMetrics: boolean;
  includeScores: boolean;
  includeTrends: boolean;
}
