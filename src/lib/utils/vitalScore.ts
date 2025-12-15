/**
 * Vital Score calculation
 * Computes a single 0-100 score from available health metrics
 */

import type { HealthMetrics, VitalScore } from '../models/types';

interface ScoreWeights {
  bodyBattery: number;
  sleepScore: number;
  stress: number;
  hrv: number;
}

// Default weights - can be tuned based on research/user feedback
const DEFAULT_WEIGHTS: ScoreWeights = {
  bodyBattery: 0.35,
  sleepScore: 0.35,
  stress: 0.20,
  hrv: 0.10,
};

/**
 * Calculate Vital Score from health metrics
 * Returns a score from 0-100 with component breakdown
 */
export function calculateVitalScore(
  metrics: HealthMetrics,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): VitalScore {
  const components = {
    recovery: calculateRecoveryComponent(metrics),
    sleep: calculateSleepComponent(metrics),
    strain: calculateStrainComponent(metrics),
  };

  // Weighted average, normalized to 0-100
  const score = Math.round(
    (components.recovery * weights.bodyBattery) +
    (components.sleep * weights.sleepScore) +
    (invertStress(metrics.stressAvg ?? 50) * weights.stress) +
    (normalizeHrv(metrics.hrvAvg) * weights.hrv)
  );

  return {
    date: metrics.date,
    score: clamp(score, 0, 100),
    sleepComponent: components.sleep,
    recoveryComponent: components.recovery,
    strainComponent: components.strain,
    recommendation: generateRecommendation(score, components),
  };
}

function calculateRecoveryComponent(metrics: HealthMetrics): number {
  // Body Battery is already 0-100
  return metrics.bodyBattery ?? 50;
}

function calculateSleepComponent(metrics: HealthMetrics): number {
  // Sleep score is already 0-100
  // Could enhance with duration/deep sleep weighting
  return metrics.sleepScore ?? 50;
}

function calculateStrainComponent(metrics: HealthMetrics): number {
  // Intensity minutes: Garmin recommends 150/week = ~21/day
  // Scale so 21 minutes = 50 (moderate), 42+ = 100 (high strain)
  const intensity = metrics.intensityMinutes ?? 0;
  return clamp(Math.round((intensity / 42) * 100), 0, 100);
}

/**
 * Invert stress (high stress = low score)
 */
function invertStress(stress: number): number {
  return 100 - stress;
}

/**
 * Normalize HRV to 0-100 scale
 * Average HRV varies widely by age/fitness, but ~50-100ms is typical for adults
 */
function normalizeHrv(hrv?: number): number {
  if (hrv === undefined) return 50; // neutral if unavailable
  // Scale: 20ms = 0, 100ms = 100
  return clamp(Math.round(((hrv - 20) / 80) * 100), 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate plain-English recommendation based on score
 */
function generateRecommendation(
  score: number,
  components: { recovery: number; sleep: number; strain: number }
): string {
  if (score >= 80) {
    return "You're primed for a high-intensity day. Push hard if you want to.";
  }
  if (score >= 60) {
    return "Solid foundation. A moderate workout would be beneficial.";
  }
  if (score >= 40) {
    if (components.sleep < 50) {
      return "Sleep was lacking. Consider light activity and earlier bedtime tonight.";
    }
    if (components.recovery < 50) {
      return "Recovery is lagging. Active recovery or rest day recommended.";
    }
    return "Take it easy today. Light movement, focus on recovery.";
  }
  return "Rest day strongly recommended. Prioritize sleep and stress management.";
}
