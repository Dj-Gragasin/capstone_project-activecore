/**
 * API Configuration
 * Central location for API endpoint configuration
 * Uses environment variable if available, falls back to sensible default
 */

export const API_CONFIG = {
  // Base URL for backend API calls
  BASE_URL: (() => {
    const fromEnv = (process.env.REACT_APP_API_URL || '').trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');

    const nodeEnv = process.env.NODE_ENV;

    // In production (and generally any non-dev environment), never fall back to localhost.
    // Use same-origin /api so Vercel (or any reverse proxy) can forward requests.
    if (nodeEnv !== 'development') {
      console.warn(
        '[API_CONFIG] REACT_APP_API_URL is not set. Falling back to same-origin /api. '
          + 'If your backend is on a different domain, set REACT_APP_API_URL and rebuild/redeploy.'
      );
      return '/api';
    }

    // Development fallback only.
    return 'http://localhost:3002/api';
  })(),
};

export default API_CONFIG;
