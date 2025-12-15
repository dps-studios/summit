/**
 * Data export utilities
 * Your data. Your files. No subscription.
 */

import type { 
  HealthMetrics, 
  VitalScore, 
  Trend, 
  ExportFormat, 
  ExportOptions,
  TrendInsight 
} from '../models/types';
import { generateInsight } from './trends';

interface ExportData {
  metrics: HealthMetrics[];
  scores: VitalScore[];
  trends: Trend[];
  exportedAt: string;
  version: string;
}

/**
 * Export data in the specified format
 */
export function exportData(
  data: ExportData,
  options: ExportOptions
): string {
  const filtered = filterByDateRange(data, options);
  
  switch (options.format) {
    case 'json':
      return exportToJson(filtered, options);
    case 'csv':
      return exportToCsv(filtered, options);
    case 'markdown':
      return exportToMarkdown(filtered, options);
    default:
      throw new Error(`Unknown export format: ${options.format}`);
  }
}

function filterByDateRange(data: ExportData, options: ExportOptions): ExportData {
  const { startDate, endDate } = options;
  
  if (!startDate && !endDate) {
    return data;
  }

  const inRange = (date: string) => {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  };

  return {
    ...data,
    metrics: data.metrics.filter(m => inRange(m.date)),
    scores: data.scores.filter(s => inRange(s.date)),
    trends: data.trends, // Trends aren't date-filtered the same way
  };
}

/**
 * Export to JSON - full fidelity, machine readable
 */
function exportToJson(data: ExportData, options: ExportOptions): string {
  const output: Partial<ExportData> = {
    exportedAt: data.exportedAt,
    version: data.version,
  };

  if (options.includeMetrics) output.metrics = data.metrics;
  if (options.includeScores) output.scores = data.scores;
  if (options.includeTrends) output.trends = data.trends;

  return JSON.stringify(output, null, 2);
}

/**
 * Export to CSV - for spreadsheet analysis
 */
function exportToCsv(data: ExportData, options: ExportOptions): string {
  const lines: string[] = [];

  if (options.includeMetrics && data.metrics.length > 0) {
    lines.push('# Health Metrics');
    lines.push('date,body_battery,sleep_score,sleep_duration_hrs,deep_sleep_hrs,rem_sleep_hrs,stress_avg,resting_hr,hrv_avg,intensity_minutes,steps');
    
    for (const m of data.metrics) {
      lines.push([
        m.date,
        m.bodyBattery ?? '',
        m.sleepScore ?? '',
        m.sleepDurationSeconds ? (m.sleepDurationSeconds / 3600).toFixed(2) : '',
        m.deepSleepSeconds ? (m.deepSleepSeconds / 3600).toFixed(2) : '',
        m.remSleepSeconds ? (m.remSleepSeconds / 3600).toFixed(2) : '',
        m.stressAvg ?? '',
        m.restingHr ?? '',
        m.hrvAvg ?? '',
        m.intensityMinutes ?? '',
        m.steps ?? '',
      ].join(','));
    }
    lines.push('');
  }

  if (options.includeScores && data.scores.length > 0) {
    lines.push('# Vital Scores');
    lines.push('date,score,sleep_component,recovery_component,strain_component,recommendation');
    
    for (const s of data.scores) {
      lines.push([
        s.date,
        s.score,
        s.sleepComponent,
        s.recoveryComponent,
        s.strainComponent,
        `"${s.recommendation ?? ''}"`,
      ].join(','));
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export to Markdown - human readable, Obsidian-friendly
 */
function exportToMarkdown(data: ExportData, options: ExportOptions): string {
  const lines: string[] = [];
  const exportDate = new Date(data.exportedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  lines.push(`# Summit Health Report`);
  lines.push(`> Exported on ${exportDate}`);
  lines.push('');

  if (options.includeScores && data.scores.length > 0) {
    const latest = data.scores[data.scores.length - 1];
    lines.push(`## Today's Vital Score: ${latest.score}/100`);
    lines.push('');
    lines.push(`**Recommendation:** ${latest.recommendation}`);
    lines.push('');
    lines.push('| Component | Score |');
    lines.push('|-----------|-------|');
    lines.push(`| Sleep | ${latest.sleepComponent} |`);
    lines.push(`| Recovery | ${latest.recoveryComponent} |`);
    lines.push(`| Strain | ${latest.strainComponent} |`);
    lines.push('');
  }

  if (options.includeTrends && data.trends.length > 0) {
    const insights = data.trends
      .filter(t => t.direction !== 'stable')
      .map(generateInsight);

    if (insights.length > 0) {
      lines.push('## Active Trends');
      lines.push('');

      for (const insight of insights) {
        const emoji = insight.direction === 'improving' ? '^' : 'v';
        lines.push(`### ${emoji} ${insight.summary}`);
        lines.push('');
        lines.push(`**Why it matters:** ${insight.whyItMatters}`);
        lines.push('');
        
        if (insight.strategies.length > 0) {
          lines.push('**Strategies:**');
          for (const strategy of insight.strategies) {
            lines.push(`- ${strategy}`);
          }
          lines.push('');
        }
      }
    }
  }

  if (options.includeMetrics && data.metrics.length > 0) {
    lines.push('## Recent Metrics');
    lines.push('');
    lines.push('| Date | Body Battery | Sleep | Stress | Steps |');
    lines.push('|------|--------------|-------|--------|-------|');

    // Show last 7 days
    const recent = data.metrics.slice(-7);
    for (const m of recent) {
      lines.push(`| ${m.date} | ${m.bodyBattery ?? '-'} | ${m.sleepScore ?? '-'} | ${m.stressAvg ?? '-'} | ${m.steps ?? '-'} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Generated by Summit v${data.version}*`);

  return lines.join('\n');
}

/**
 * Generate a weekly summary report in Markdown
 */
export function generateWeeklyReport(
  metrics: HealthMetrics[],
  scores: VitalScore[],
  trends: Trend[]
): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weekMetrics = metrics.filter(m => new Date(m.date) >= weekAgo);
  const weekScores = scores.filter(s => new Date(s.date) >= weekAgo);
  
  const avgScore = weekScores.length > 0
    ? Math.round(weekScores.reduce((a, b) => a + b.score, 0) / weekScores.length)
    : null;

  const lines: string[] = [];
  const weekStart = weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  lines.push(`# Weekly Health Summary`);
  lines.push(`## ${weekStart} - ${weekEnd}`);
  lines.push('');

  if (avgScore !== null) {
    lines.push(`**Average Vital Score:** ${avgScore}/100`);
    lines.push('');
  }

  // Find notable trends from the week
  const weeklyInsights = trends
    .filter(t => t.timeframe === '1W' && t.direction !== 'stable')
    .map(generateInsight);

  if (weeklyInsights.length > 0) {
    lines.push('### Key Observations');
    lines.push('');
    for (const insight of weeklyInsights) {
      lines.push(`- ${insight.summary}`);
    }
    lines.push('');
  }

  lines.push('### Daily Breakdown');
  lines.push('');
  lines.push('| Date | Vital Score | Recommendation |');
  lines.push('|------|-------------|----------------|');

  for (const score of weekScores) {
    const shortRec = score.recommendation?.split('.')[0] ?? '-';
    lines.push(`| ${score.date} | ${score.score} | ${shortRec} |`);
  }

  return lines.join('\n');
}
