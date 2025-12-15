# Garmin API Setup

## Overview

Summit uses the Garmin Connect Health API to fetch your health data. This requires registering as a developer with Garmin.

## Step 1: Apply for Developer Access

1. Go to [Garmin Developer Access Form](https://www.garmin.com/forms/GarminConnectDeveloperAccess)
2. Fill in the application:
   - **App Name**: Summit
   - **Description**: Personal health analytics app that helps Garmin users understand long-term trends. Analyzes trajectory across multiple timeframes (weekly to yearly) to detect meaningful shifts early and provide actionable insights.
   - **Data needed**: Sleep, Body Battery, stress, heart rate, activity data
   - **Platform**: Desktop (macOS) and mobile (iOS/Android)
   - **Monetization**: One-time purchase ($15-25)
   - **Data Usage**: All user data stored locally on device. No cloud storage or third-party sharing.

3. Submit and wait for approval (typically 2 business days)

## Step 2: Integration Call (Optional)

Garmin offers an integration call to walk through:
- API capabilities and limitations
- OAuth implementation details
- Rate limits and best practices
- HRV licensing (if needed)

Request this if you have questions about implementation.

## Step 3: OAuth Configuration

Once approved, you'll receive:
- Consumer Key
- Consumer Secret

Garmin uses **OAuth 1.0a** (not OAuth 2.0). The flow:

1. Request token from Garmin
2. Redirect user to Garmin authorization page
3. User grants permission
4. Exchange request token for access token
5. Store access token securely (Tauri secure storage)

## Available Health API Endpoints

| Endpoint | Data |
|----------|------|
| `/wellness-api/rest/dailies` | Steps, calories, stress, Body Battery |
| `/wellness-api/rest/sleeps` | Sleep duration, stages, score |
| `/wellness-api/rest/heartRates` | Heart rate samples |
| `/wellness-api/rest/pulseOx` | Blood oxygen |
| `/wellness-api/rest/respiration` | Breathing rate |
| `/wellness-api/rest/bodyComps` | Weight, body fat |

## HRV Data

Enhanced Beat-to-Beat Interval (HRV) data requires a separate license for commercial use. 

Options:
1. Launch without HRV, add later if Summit gains traction
2. Contact Garmin during integration call to discuss licensing terms
3. Use HRV for personal/non-commercial builds only

## Rate Limits

- Respect Garmin's rate limits (details provided after approval)
- Implement exponential backoff for retries
- Cache data locally to minimize API calls
- Sync once per day is typically sufficient

## Troubleshooting

### "Invalid consumer key"
- Double-check your credentials
- Ensure you're using the production keys, not sandbox

### "User denied access"
- User must grant permission on Garmin's site
- Check that your redirect URI matches your registration

### "Rate limit exceeded"
- Implement caching
- Reduce sync frequency
- Contact Garmin if you need higher limits
