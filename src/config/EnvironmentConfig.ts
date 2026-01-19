/**
 * Sweeftcom Environment Configuration
 * Switching between Staging (Pilot) and Production (Live).
 */

const ENV = {
  STAGING: {
    API_URL: 'https://staging-api.sweeftcom.com',
    SUPABASE_URL: 'https://your-staging-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-staging-anon-key',
    SENTRY_DSN: 'https://staging-dsn@sentry.io/1',
    IS_PILOT: true,
  },
  PRODUCTION: {
    API_URL: 'https://api.sweeftcom.com',
    SUPABASE_URL: 'https://your-production-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-production-anon-key',
    SENTRY_DSN: 'https://production-dsn@sentry.io/2',
    IS_PILOT: false,
  }
};

// Toggle this for Pilot Rollout
const IS_PRODUCTION = false;

export const Config = IS_PRODUCTION ? ENV.PRODUCTION : ENV.STAGING;

export const getEnvironment = () => IS_PRODUCTION ? 'production' : 'staging';
