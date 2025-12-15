/**
 * Mock data generator for development
 * Generates realistic health metrics with gradual shifts and patterns
 */

import type { HealthMetrics } from '../models/types';

interface MockConfig {
  /** Number of days of history to generate */
  days: number;
  /** Base profile for the simulated user */
  profile: UserProfile;
  /** Shifts to simulate over the time period */
  shifts: Shift[];
}

interface UserProfile {
  /** Average Body Battery (0-100), typically 50-80 for healthy adult */
  baseBodyBattery: number;
  /** Average sleep score (0-100), typically 60-85 */
  baseSleepScore: number;
  /** Average sleep duration in hours, typically 6-8 */
  baseSleepHours: number;
  /** Percentage of sleep that's deep (15-25% is normal) */
  deepSleepPercent: number;
  /** Percentage of sleep that's REM (20-25% is normal) */
  remSleepPercent: number;
  /** Average stress level (0-100), typically 25-45 for healthy adult */
  baseStress: number;
  /** Resting heart rate, typically 55-75 for active adult */
  baseRestingHr: number;
  /** HRV average in ms, typically 40-100 depending on age/fitness */
  baseHrv: number;
  /** Daily intensity minutes, typically 15-45 for active person */
  baseIntensityMinutes: number;
  /** Daily steps, typically 6000-12000 */
  baseSteps: number;
}

interface Shift {
  /** Which metric to shift */
  metric: keyof UserProfile;
  /** When the shift starts (days from end, negative = past) */
  startDay: number;
  /** How much to change the metric (can be negative) */
  delta: number;
  /** How quickly the shift happens: 'gradual' | 'sudden' */
  type: 'gradual' | 'sudden';
}

// Realistic baseline for a moderately active adult
const DEFAULT_PROFILE: UserProfile = {
  baseBodyBattery: 65,
  baseSleepScore: 72,
  baseSleepHours: 7.2,
  deepSleepPercent: 0.18,
  remSleepPercent: 0.22,
  baseStress: 35,
  baseRestingHr: 62,
  baseHrv: 55,
  baseIntensityMinutes: 28,
  baseSteps: 8500,
};

/**
 * Add realistic daily variance to a value
 * Health metrics naturally fluctuate day-to-day
 */
function addVariance(base: number, variancePercent: number = 0.15): number {
  const variance = base * variancePercent;
  return base + (Math.random() - 0.5) * 2 * variance;
}

/**
 * Add weekly patterns (weekends vs weekdays)
 */
function applyWeeklyPattern(base: number, dayOfWeek: number, metric: string): number {
  // Weekend effects
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  switch (metric) {
    case 'sleep':
      // People often sleep more on weekends
      return isWeekend ? base * 1.08 : base;
    case 'stress':
      // Lower stress on weekends typically
      return isWeekend ? base * 0.85 : base;
    case 'steps':
      // Often fewer steps on weekends (less commuting)
      return isWeekend ? base * 0.75 : base;
    case 'intensity':
      // More intentional exercise on weekends for some
      return isWeekend ? base * 1.15 : base;
    default:
      return base;
  }
}

/**
 * Calculate shift effect for a given day
 */
function calculateShiftEffect(
  shift: Shift,
  daysFromEnd: number
): number {
  // Shift hasn't started yet
  if (daysFromEnd > Math.abs(shift.startDay)) {
    return 0;
  }

  const daysIntoShift = Math.abs(shift.startDay) - daysFromEnd;
  
  if (shift.type === 'sudden') {
    return shift.delta;
  }

  // Gradual shift: linear interpolation over the shift period
  const shiftDuration = Math.abs(shift.startDay);
  const progress = Math.min(daysIntoShift / shiftDuration, 1);
  return shift.delta * progress;
}

/**
 * Generate a single day's metrics
 */
function generateDayMetrics(
  date: Date,
  profile: UserProfile,
  shifts: Shift[],
  daysFromEnd: number
): HealthMetrics {
  const dayOfWeek = date.getDay();
  
  // Start with base values
  let bodyBattery = profile.baseBodyBattery;
  let sleepScore = profile.baseSleepScore;
  let sleepHours = profile.baseSleepHours;
  let stress = profile.baseStress;
  let restingHr = profile.baseRestingHr;
  let hrv = profile.baseHrv;
  let intensityMinutes = profile.baseIntensityMinutes;
  let steps = profile.baseSteps;

  // Apply shifts
  for (const shift of shifts) {
    const effect = calculateShiftEffect(shift, daysFromEnd);
    switch (shift.metric) {
      case 'baseBodyBattery':
        bodyBattery += effect;
        break;
      case 'baseSleepScore':
        sleepScore += effect;
        break;
      case 'baseSleepHours':
        sleepHours += effect;
        break;
      case 'baseStress':
        stress += effect;
        break;
      case 'baseRestingHr':
        restingHr += effect;
        break;
      case 'baseHrv':
        hrv += effect;
        break;
      case 'baseIntensityMinutes':
        intensityMinutes += effect;
        break;
      case 'baseSteps':
        steps += effect;
        break;
    }
  }

  // Apply weekly patterns
  sleepHours = applyWeeklyPattern(sleepHours, dayOfWeek, 'sleep');
  stress = applyWeeklyPattern(stress, dayOfWeek, 'stress');
  steps = applyWeeklyPattern(steps, dayOfWeek, 'steps');
  intensityMinutes = applyWeeklyPattern(intensityMinutes, dayOfWeek, 'intensity');

  // Add daily variance
  bodyBattery = addVariance(bodyBattery, 0.12);
  sleepScore = addVariance(sleepScore, 0.10);
  sleepHours = addVariance(sleepHours, 0.08);
  stress = addVariance(stress, 0.20);
  restingHr = addVariance(restingHr, 0.05);
  hrv = addVariance(hrv, 0.15);
  intensityMinutes = addVariance(intensityMinutes, 0.30);
  steps = addVariance(steps, 0.25);

  // Calculate sleep stage durations
  const sleepDurationSeconds = Math.round(sleepHours * 3600);
  const deepSleepSeconds = Math.round(sleepDurationSeconds * addVariance(profile.deepSleepPercent, 0.15));
  const remSleepSeconds = Math.round(sleepDurationSeconds * addVariance(profile.remSleepPercent, 0.15));

  // Clamp values to realistic ranges
  return {
    date: date.toISOString().split('T')[0],
    bodyBattery: clamp(Math.round(bodyBattery), 5, 100),
    sleepScore: clamp(Math.round(sleepScore), 20, 100),
    sleepDurationSeconds: clamp(sleepDurationSeconds, 3600, 36000), // 1-10 hours
    deepSleepSeconds: clamp(deepSleepSeconds, 0, sleepDurationSeconds * 0.4),
    remSleepSeconds: clamp(remSleepSeconds, 0, sleepDurationSeconds * 0.35),
    stressAvg: clamp(Math.round(stress), 5, 95),
    restingHr: clamp(Math.round(restingHr), 40, 100),
    hrvAvg: clamp(Math.round(hrv), 15, 150),
    intensityMinutes: clamp(Math.round(intensityMinutes), 0, 180),
    steps: clamp(Math.round(steps), 500, 30000),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate mock health data with realistic patterns and shifts
 */
export function generateMockData(config?: Partial<MockConfig>): HealthMetrics[] {
  const fullConfig: MockConfig = {
    days: config?.days ?? 180, // 6 months default
    profile: { ...DEFAULT_PROFILE, ...config?.profile },
    shifts: config?.shifts ?? DEFAULT_SHIFTS,
  };

  const metrics: HealthMetrics[] = [];
  const endDate = new Date();
  
  for (let i = fullConfig.days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    
    const dayMetrics = generateDayMetrics(
      date,
      fullConfig.profile,
      fullConfig.shifts,
      i
    );
    metrics.push(dayMetrics);
  }

  return metrics;
}

/**
 * Default shifts that simulate realistic health trajectory changes
 * These create interesting patterns for trend detection to find
 */
const DEFAULT_SHIFTS: Shift[] = [
  // Sleep quality declining over past 3 weeks (stress at work?)
  {
    metric: 'baseSleepScore',
    startDay: -21,
    delta: -12,
    type: 'gradual',
  },
  // Deep sleep hit harder
  {
    metric: 'deepSleepPercent' as keyof UserProfile,
    startDay: -21,
    delta: -0.04,
    type: 'gradual',
  },
  // Stress creeping up over past month
  {
    metric: 'baseStress',
    startDay: -30,
    delta: 15,
    type: 'gradual',
  },
  // HRV dropping as a result (body not recovering well)
  {
    metric: 'baseHrv',
    startDay: -25,
    delta: -12,
    type: 'gradual',
  },
  // Body Battery suffering
  {
    metric: 'baseBodyBattery',
    startDay: -20,
    delta: -10,
    type: 'gradual',
  },
  // Activity dropped off 2 weeks ago (too tired)
  {
    metric: 'baseIntensityMinutes',
    startDay: -14,
    delta: -12,
    type: 'gradual',
  },
  // Steps down too
  {
    metric: 'baseSteps',
    startDay: -14,
    delta: -2000,
    type: 'gradual',
  },
  // Resting HR elevated (sign of overtraining/stress)
  {
    metric: 'baseRestingHr',
    startDay: -18,
    delta: 5,
    type: 'gradual',
  },
];

/**
 * Preset scenarios for testing different user situations
 */
export const MOCK_SCENARIOS = {
  /** Healthy baseline with no significant shifts */
  healthy: {
    days: 180,
    profile: DEFAULT_PROFILE,
    shifts: [],
  },
  
  /** Gradual burnout pattern (common for knowledge workers) */
  burnout: {
    days: 180,
    profile: DEFAULT_PROFILE,
    shifts: DEFAULT_SHIFTS,
  },
  
  /** Recovery arc - was struggling, now improving */
  recovery: {
    days: 180,
    profile: {
      ...DEFAULT_PROFILE,
      baseBodyBattery: 55,
      baseSleepScore: 62,
      baseStress: 48,
    },
    shifts: [
      { metric: 'baseSleepScore' as keyof UserProfile, startDay: -45, delta: 15, type: 'gradual' as const },
      { metric: 'baseStress' as keyof UserProfile, startDay: -45, delta: -18, type: 'gradual' as const },
      { metric: 'baseHrv' as keyof UserProfile, startDay: -40, delta: 12, type: 'gradual' as const },
      { metric: 'baseBodyBattery' as keyof UserProfile, startDay: -35, delta: 15, type: 'gradual' as const },
    ],
  },
  
  /** Training ramp-up pattern (athlete increasing load) */
  trainingRamp: {
    days: 180,
    profile: {
      ...DEFAULT_PROFILE,
      baseIntensityMinutes: 20,
      baseSteps: 7000,
    },
    shifts: [
      { metric: 'baseIntensityMinutes' as keyof UserProfile, startDay: -60, delta: 25, type: 'gradual' as const },
      { metric: 'baseSteps' as keyof UserProfile, startDay: -60, delta: 4000, type: 'gradual' as const },
      // Fitness adaptations
      { metric: 'baseRestingHr' as keyof UserProfile, startDay: -45, delta: -4, type: 'gradual' as const },
      { metric: 'baseHrv' as keyof UserProfile, startDay: -45, delta: 8, type: 'gradual' as const },
    ],
  },
  
  /** Sudden life event impact (illness, travel, major stress) */
  acuteStress: {
    days: 90,
    profile: DEFAULT_PROFILE,
    shifts: [
      { metric: 'baseSleepScore' as keyof UserProfile, startDay: -10, delta: -20, type: 'sudden' as const },
      { metric: 'baseStress' as keyof UserProfile, startDay: -10, delta: 25, type: 'sudden' as const },
      { metric: 'baseHrv' as keyof UserProfile, startDay: -10, delta: -18, type: 'sudden' as const },
      { metric: 'baseBodyBattery' as keyof UserProfile, startDay: -10, delta: -25, type: 'sudden' as const },
    ],
  },
} as const;

/**
 * Quick helper to generate data for a specific scenario
 */
export function generateScenario(scenario: keyof typeof MOCK_SCENARIOS): HealthMetrics[] {
  const config = MOCK_SCENARIOS[scenario];
  return generateMockData({
    days: config.days,
    profile: { ...config.profile },
    shifts: [...config.shifts] as Shift[],
  });
}
