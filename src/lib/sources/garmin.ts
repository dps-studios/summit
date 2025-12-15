/**
 * Garmin Connect data source
 * Implements OAuth 2.0 flow and Health API integration
 */

import type { DataSource } from './index';
import type { HealthMetrics } from '../models/types';

// Garmin OAuth endpoints
const GARMIN_AUTH_URL = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';

interface GarminTokens {
  accessToken: string;
  accessTokenSecret: string;
  expiresAt?: number;
}

/**
 * Garmin Connect data source
 * 
 * Note: Requires approved developer access from Garmin.
 * Apply at: garmin.com/forms/GarminConnectDeveloperAccess
 */
export class GarminSource implements DataSource {
  name = 'garmin';
  private tokens: GarminTokens | null = null;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(consumerKey: string, consumerSecret: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  async isConnected(): Promise<boolean> {
    return this.tokens !== null;
  }

  async connect(): Promise<void> {
    // TODO: Implement OAuth 1.0a flow (Garmin uses OAuth 1.0a, not 2.0)
    // 1. Request token
    // 2. Redirect user to authorization
    // 3. Exchange for access token
    // 4. Store tokens securely
    throw new Error('Garmin OAuth not yet implemented - awaiting API approval');
  }

  async disconnect(): Promise<void> {
    this.tokens = null;
  }

  async fetchMetrics(startDate: string, endDate: string): Promise<HealthMetrics[]> {
    if (!this.tokens) {
      throw new Error('Not connected to Garmin');
    }

    // TODO: Implement API calls to Garmin Health API endpoints:
    // - /wellness-api/rest/dailies (steps, calories, stress, body battery)
    // - /wellness-api/rest/sleeps (sleep data)
    // - /wellness-api/rest/heartRates (HR data)
    // - /wellness-api/rest/pulseOx (pulse ox)
    
    throw new Error('Garmin API integration not yet implemented');
  }

  async fetchLatest(): Promise<HealthMetrics | null> {
    const today = new Date().toISOString().split('T')[0];
    const metrics = await this.fetchMetrics(today, today);
    return metrics[0] ?? null;
  }

  /**
   * Transform Garmin API response to our HealthMetrics format
   */
  private transformGarminData(garminData: unknown): HealthMetrics {
    // TODO: Map Garmin's response fields to our schema
    // Garmin fields: bodyBatteryChargedValue, sleepScores, stressLevel, etc.
    throw new Error('Not implemented');
  }
}
