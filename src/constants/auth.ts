
export const ACCESS_TOKEN_EXPIRE_TIME = 30 * 60;
export const REFRESH_TOKEN_EXPIRE_TIME = 30 * 24 * 60 * 60;
export const CACHE_DURATION = 25 * 60;
export const DURATION_EXPIRE_TIME =  30 * 60;

export const AUTH_CODE = {
  SUCCESS: 'SUCCESS',
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
}

// Enable auth for production use - set to true for production with auth
export const ENABLE_AUTH = true;

// Default user ID for development when auth is disabled
export const DEFAULT_DEV_USER_ID = 1;
