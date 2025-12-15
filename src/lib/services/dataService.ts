/**
 * Data service - orchestrates data flow between sources, DB, and calculations
 */

import { generateScenario, generateMockData, MOCK_SCENARIOS } from '../utils/mockData';
import { calculateVitalScore } from '../utils/vitalScore';
import { analyzeTrends, detectSignificantShifts } from '../utils/trends';
import * as db from '../db';
import type { HealthMetrics, VitalScore, Trend, TrendInsight, Timeframe } from '../models/types';

/**
 * Initialize the app with mock data for development
 */
export async function initWithMockData(
  scenario: keyof typeof MOCK_SCENARIOS = 'burnout'
): Promise<void> {
  await db.initDb();
  
  // Check if we already have data
  const count = await db.getMetricsCount();
  if (count > 0) {
    console.log(`Database already has ${count} days of data`);
    return;
  }

  console.log(`Generating mock data for scenario: ${scenario}`);
  const metrics = generateScenario(scenario);
  
  // Insert metrics
  await db.insertMetrics(metrics);
  console.log(`Inserted ${metrics.length} days of health metrics`);

  // Calculate and insert vital scores for each day
  for (const m of metrics) {
    const score = calculateVitalScore(m);
    await db.insertVitalScore(score);
  }
  console.log(`Calculated ${metrics.length} vital scores`);

  // Analyze trends and store them
  await refreshTrends();
  console.log('Trend analysis complete');
}

/**
 * Refresh trend calculations based on current data
 */
export async function refreshTrends(): Promise<void> {
  const metrics = await db.getMetrics();
  
  const trendMetrics: Array<Trend['metric']> = [
    'body_battery',
    'sleep_score',
    'sleep_duration',
    'deep_sleep',
    'stress',
    'resting_hr',
    'hrv',
    'intensity_minutes',
    'steps',
  ];

  for (const metric of trendMetrics) {
    const trends = analyzeTrends(metrics, metric);
    for (const trend of trends) {
      await db.upsertTrend(trend);
    }
  }
}

/**
 * Get dashboard data for today's view
 */
export async function getDashboardData(): Promise<{
  todayScore: VitalScore | null;
  recentMetrics: HealthMetrics[];
  activeInsights: TrendInsight[];
}> {
  const todayScore = await db.getLatestVitalScore();
  
  // Get last 7 days of metrics for sparklines
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentMetrics = await db.getMetrics(
    weekAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );

  // Get significant trend shifts
  const trends = await db.getTrends();
  const activeInsights = detectSignificantShifts(trends);

  return {
    todayScore,
    recentMetrics,
    activeInsights,
  };
}

/**
 * Get trend data for a specific timeframe
 */
export async function getTrendData(timeframe: Timeframe): Promise<{
  metrics: HealthMetrics[];
  trends: Trend[];
  insights: TrendInsight[];
}> {
  const days: Record<Timeframe, number> = {
    '1W': 7,
    '2W': 14,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
  };

  const now = new Date();
  const startDate = new Date(now.getTime() - days[timeframe] * 24 * 60 * 60 * 1000);
  
  const metrics = await db.getMetrics(
    startDate.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );

  const allTrends = await db.getTrends();
  const trends = allTrends.filter(t => t.timeframe === timeframe);
  const insights = detectSignificantShifts(trends);

  return {
    metrics,
    trends,
    insights,
  };
}

/**
 * Get all vital scores for charting
 */
export async function getVitalScoreHistory(days: number = 30): Promise<VitalScore[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  return db.getVitalScores(
    startDate.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );
}

/**
 * Reset all data and regenerate with a different scenario
 */
export async function resetWithScenario(
  scenario: keyof typeof MOCK_SCENARIOS
): Promise<void> {
  await db.clearAllData();
  
  const metrics = generateScenario(scenario);
  await db.insertMetrics(metrics);

  for (const m of metrics) {
    const score = calculateVitalScore(m);
    await db.insertVitalScore(score);
  }

  await refreshTrends();
}

/**
 * Get available mock scenarios for dev UI
 */
export function getAvailableScenarios(): string[] {
  return Object.keys(MOCK_SCENARIOS);
}
