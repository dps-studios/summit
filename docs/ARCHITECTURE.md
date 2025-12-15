# Architecture

## Overview

Summit is a local-first health analytics app built with Tauri v2. It pulls data from Garmin Connect and presents it with a focus on long-term trends rather than daily snapshots.

## Core Principles

1. **Local-first** - All data lives on your device in SQLite. No cloud accounts, no subscriptions.
2. **Source-agnostic** - Data source abstraction allows adding Apple Health, Oura, etc. later.
3. **Trend-focused** - The primary value is trajectory detection, not dashboards.

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Garmin Connect │────▶│  Summit Backend  │────▶│    SQLite DB    │
│      API        │     │     (Rust)       │     │   (summit.db)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Svelte UI      │◀────│  Trend Analysis │
                        │   (Frontend)     │     │    (TypeScript) │
                        └──────────────────┘     └─────────────────┘
```

## Database Schema

### health_metrics
Raw data synced from Garmin. One row per day.

| Column | Type | Description |
|--------|------|-------------|
| date | TEXT | ISO date (YYYY-MM-DD), unique |
| body_battery | INTEGER | 0-100, Garmin's energy metric |
| sleep_score | INTEGER | 0-100 |
| sleep_duration_seconds | INTEGER | Total sleep time |
| deep_sleep_seconds | INTEGER | Deep sleep portion |
| rem_sleep_seconds | INTEGER | REM sleep portion |
| stress_avg | INTEGER | Daily average stress (0-100) |
| resting_hr | INTEGER | Resting heart rate |
| hrv_avg | INTEGER | HRV if available |
| intensity_minutes | INTEGER | Activity intensity |
| steps | INTEGER | Daily steps |

### vital_scores
Computed daily scores with component breakdown.

| Column | Type | Description |
|--------|------|-------------|
| date | TEXT | ISO date, unique |
| score | INTEGER | 0-100 composite score |
| sleep_component | INTEGER | Sleep contribution |
| recovery_component | INTEGER | Recovery contribution |
| strain_component | INTEGER | Strain/activity contribution |
| recommendation | TEXT | Plain English advice |

### trends
Detected trajectory shifts per metric/timeframe.

| Column | Type | Description |
|--------|------|-------------|
| metric | TEXT | Which health metric |
| timeframe | TEXT | 1W, 2W, 1M, 3M, 6M, 1Y |
| baseline | REAL | Average from start of period |
| current_avg | REAL | Average from end of period |
| percent_change | REAL | Change percentage |
| direction | TEXT | improving, stable, declining |

## Vital Score Algorithm

The Vital Score is a weighted composite:

```
score = (body_battery × 0.35) + 
        (sleep_score × 0.35) + 
        (inverted_stress × 0.20) + 
        (normalized_hrv × 0.10)
```

Weights are tunable. HRV is optional (requires Garmin license for commercial use).

## Trend Detection

For each metric and timeframe:

1. Gather all data points within the timeframe
2. Calculate baseline average (first third of period)
3. Calculate current average (last third of period)
4. Compute percent change
5. Flag as "declining" if change exceeds -10%

This simple rule-based approach ships faster than ML and is explainable.

## Data Sources

The `DataSource` interface allows plugging in new sources:

```typescript
interface DataSource {
  name: string;
  isConnected(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchMetrics(startDate: string, endDate: string): Promise<HealthMetrics[]>;
  fetchLatest(): Promise<HealthMetrics | null>;
}
```

Currently implemented:
- `GarminSource` - Garmin Connect API (OAuth 1.0a)

Future candidates:
- Apple HealthKit
- Oura Ring
- Whoop (if they open API)
- Manual CSV import
