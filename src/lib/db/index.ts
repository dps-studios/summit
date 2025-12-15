/**
 * Database service for Summit
 * Handles SQLite operations via Tauri plugin
 */

import Database from '@tauri-apps/plugin-sql';
import type { HealthMetrics, VitalScore, Trend } from '../models/types';

let db: Database | null = null;

/**
 * Initialize database connection
 */
export async function initDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load('sqlite:summit.db');
  return db;
}

/**
 * Get database instance (must call initDb first)
 */
export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// ============================================
// Health Metrics
// ============================================

export async function insertMetrics(metrics: HealthMetrics[]): Promise<void> {
  const database = getDb();
  
  for (const m of metrics) {
    await database.execute(
      `INSERT OR REPLACE INTO health_metrics 
       (date, body_battery, sleep_score, sleep_duration_seconds, deep_sleep_seconds, 
        rem_sleep_seconds, stress_avg, resting_hr, hrv_avg, intensity_minutes, steps, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
      [
        m.date,
        m.bodyBattery ?? null,
        m.sleepScore ?? null,
        m.sleepDurationSeconds ?? null,
        m.deepSleepSeconds ?? null,
        m.remSleepSeconds ?? null,
        m.stressAvg ?? null,
        m.restingHr ?? null,
        m.hrvAvg ?? null,
        m.intensityMinutes ?? null,
        m.steps ?? null,
      ]
    );
  }
}

export async function getMetrics(startDate?: string, endDate?: string): Promise<HealthMetrics[]> {
  const database = getDb();
  
  let query = 'SELECT * FROM health_metrics';
  const params: string[] = [];
  
  if (startDate && endDate) {
    query += ' WHERE date >= $1 AND date <= $2';
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ' WHERE date >= $1';
    params.push(startDate);
  } else if (endDate) {
    query += ' WHERE date <= $1';
    params.push(endDate);
  }
  
  query += ' ORDER BY date ASC';
  
  const rows = await database.select<DbHealthMetrics[]>(query, params);
  return rows.map(mapDbToHealthMetrics);
}

export async function getLatestMetrics(): Promise<HealthMetrics | null> {
  const database = getDb();
  const rows = await database.select<DbHealthMetrics[]>(
    'SELECT * FROM health_metrics ORDER BY date DESC LIMIT 1'
  );
  return rows.length > 0 ? mapDbToHealthMetrics(rows[0]) : null;
}

export async function getMetricsCount(): Promise<number> {
  const database = getDb();
  const result = await database.select<[{ count: number }]>(
    'SELECT COUNT(*) as count FROM health_metrics'
  );
  return result[0]?.count ?? 0;
}

// ============================================
// Vital Scores
// ============================================

export async function insertVitalScore(score: VitalScore): Promise<void> {
  const database = getDb();
  
  await database.execute(
    `INSERT OR REPLACE INTO vital_scores 
     (date, score, sleep_component, recovery_component, strain_component, recommendation)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      score.date,
      score.score,
      score.sleepComponent,
      score.recoveryComponent,
      score.strainComponent,
      score.recommendation ?? null,
    ]
  );
}

export async function getVitalScores(startDate?: string, endDate?: string): Promise<VitalScore[]> {
  const database = getDb();
  
  let query = 'SELECT * FROM vital_scores';
  const params: string[] = [];
  
  if (startDate && endDate) {
    query += ' WHERE date >= $1 AND date <= $2';
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ' WHERE date >= $1';
    params.push(startDate);
  }
  
  query += ' ORDER BY date ASC';
  
  const rows = await database.select<DbVitalScore[]>(query, params);
  return rows.map(mapDbToVitalScore);
}

export async function getLatestVitalScore(): Promise<VitalScore | null> {
  const database = getDb();
  const rows = await database.select<DbVitalScore[]>(
    'SELECT * FROM vital_scores ORDER BY date DESC LIMIT 1'
  );
  return rows.length > 0 ? mapDbToVitalScore(rows[0]) : null;
}

// ============================================
// Trends
// ============================================

export async function upsertTrend(trend: Trend): Promise<void> {
  const database = getDb();
  
  await database.execute(
    `INSERT OR REPLACE INTO trends 
     (metric, timeframe, baseline, current_avg, percent_change, direction, detected_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [
      trend.metric,
      trend.timeframe,
      trend.baseline,
      trend.currentAvg,
      trend.percentChange,
      trend.direction,
    ]
  );
}

export async function getTrends(): Promise<Trend[]> {
  const database = getDb();
  const rows = await database.select<DbTrend[]>(
    'SELECT * FROM trends ORDER BY metric, timeframe'
  );
  return rows.map(mapDbToTrend);
}

export async function clearAllData(): Promise<void> {
  const database = getDb();
  await database.execute('DELETE FROM health_metrics');
  await database.execute('DELETE FROM vital_scores');
  await database.execute('DELETE FROM trends');
}

// ============================================
// Type Mappings (DB snake_case -> TS camelCase)
// ============================================

interface DbHealthMetrics {
  id: number;
  date: string;
  body_battery: number | null;
  sleep_score: number | null;
  sleep_duration_seconds: number | null;
  deep_sleep_seconds: number | null;
  rem_sleep_seconds: number | null;
  stress_avg: number | null;
  resting_hr: number | null;
  hrv_avg: number | null;
  intensity_minutes: number | null;
  steps: number | null;
  created_at: string;
  updated_at: string;
}

interface DbVitalScore {
  id: number;
  date: string;
  score: number;
  sleep_component: number;
  recovery_component: number;
  strain_component: number;
  recommendation: string | null;
  created_at: string;
}

interface DbTrend {
  id: number;
  metric: string;
  timeframe: string;
  baseline: number;
  current_avg: number;
  percent_change: number;
  direction: string;
  detected_at: string;
}

function mapDbToHealthMetrics(row: DbHealthMetrics): HealthMetrics {
  return {
    id: row.id,
    date: row.date,
    bodyBattery: row.body_battery ?? undefined,
    sleepScore: row.sleep_score ?? undefined,
    sleepDurationSeconds: row.sleep_duration_seconds ?? undefined,
    deepSleepSeconds: row.deep_sleep_seconds ?? undefined,
    remSleepSeconds: row.rem_sleep_seconds ?? undefined,
    stressAvg: row.stress_avg ?? undefined,
    restingHr: row.resting_hr ?? undefined,
    hrvAvg: row.hrv_avg ?? undefined,
    intensityMinutes: row.intensity_minutes ?? undefined,
    steps: row.steps ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbToVitalScore(row: DbVitalScore): VitalScore {
  return {
    id: row.id,
    date: row.date,
    score: row.score,
    sleepComponent: row.sleep_component,
    recoveryComponent: row.recovery_component,
    strainComponent: row.strain_component,
    recommendation: row.recommendation ?? undefined,
    createdAt: row.created_at,
  };
}

function mapDbToTrend(row: DbTrend): Trend {
  return {
    id: row.id,
    metric: row.metric as Trend['metric'],
    timeframe: row.timeframe as Trend['timeframe'],
    baseline: row.baseline,
    currentAvg: row.current_avg,
    percentChange: row.percent_change,
    direction: row.direction as Trend['direction'],
    detectedAt: row.detected_at,
  };
}
