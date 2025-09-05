
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
// Disable auth during development when database is not configured
function checkDatabaseConfiguration(): boolean {
  try {
    // Only check on server side where we have access to full env vars
    if (typeof window !== 'undefined') {
      // On client side, assume auth is disabled for development
      return false;
    }
    
    const hasValidApiKey = process.env.POSTGREST_API_KEY && 
                          process.env.POSTGREST_API_KEY !== 'PLACEHOLDER_DISABLE_AUTO_INIT' &&
                          process.env.POSTGREST_API_KEY !== 'your_postgrest_api_key_here';
    
    return Boolean(
      process.env.POSTGREST_URL && 
      process.env.POSTGREST_SCHEMA && 
      hasValidApiKey
    );
  } catch {
    return false;
  }
}

export const ENABLE_AUTH = checkDatabaseConfiguration();

// Default user ID for development when auth is disabled
export const DEFAULT_DEV_USER_ID = 1;
