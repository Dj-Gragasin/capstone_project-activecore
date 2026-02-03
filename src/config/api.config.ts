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

    const isProd = process.env.NODE_ENV === 'production';

    // In production, silently defaulting to localhost breaks real devices (Android/iOS) because
    // "localhost" refers to the PHONE itself. Try to infer a same-origin API, otherwise warn.
    if (isProd && typeof window !== 'undefined' && window.location?.origin) {
      // If you host the API behind the same domain (reverse proxy), this will work.
      // Otherwise you MUST set REACT_APP_API_URL at build time.
      // Example: https://api.example.com/api
      console.warn(
        '[API_CONFIG] REACT_APP_API_URL is not set for a production build. Falling back to same-origin /api. '
        + 'If your backend is on a different domain, set REACT_APP_API_URL and rebuild/redeploy.'
      );
      return `${window.location.origin.replace(/\/$/, '')}/api`;
    }

    // Development fallback only.
    return 'http://localhost:3002/api';
  })(),
};

export default API_CONFIG;
