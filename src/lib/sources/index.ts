/**
 * Data source abstraction layer
 * Designed to support multiple sources (Garmin, Apple Health, etc.) in the future
 */

import type { HealthMetrics } from '../models/types';

export interface DataSource {
  name: string;
  isConnected(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchMetrics(startDate: string, endDate: string): Promise<HealthMetrics[]>;
  fetchLatest(): Promise<HealthMetrics | null>;
}

/**
 * Registry of available data sources
 * Add new sources here as they're implemented
 */
export const dataSources: Map<string, DataSource> = new Map();

export function registerSource(source: DataSource): void {
  dataSources.set(source.name, source);
}

export function getSource(name: string): DataSource | undefined {
  return dataSources.get(name);
}

export function listSources(): string[] {
  return Array.from(dataSources.keys());
}
