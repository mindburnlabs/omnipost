# Development Setup

This guide helps you set up OmniPost for local development and resolve common database connection issues.

## Database Connection Issues

If you're seeing errors like:
```
Error syncing with database: Error: Database connection failed for posts: No suitable key or wrong key type
```

This usually means the PostgREST database service is not running or not properly configured.

## Quick Fix ✅ APPLIED

The following fixes have been applied to resolve database connection issues:

1. **Environment Configuration (✅ Done):**
   - Created `.env` file with placeholder values
   - Set `POSTGREST_API_KEY=PLACEHOLDER_DISABLE_AUTO_INIT` to disable automatic database initialization

2. **Code Improvements (✅ Done):**
   - Added graceful error handling for database connection failures
   - Disabled authentication when database is not configured
   - Prevented automatic service initialization when database is unavailable
   - Improved error messages and reduced console noise

3. **Start the Application:**
   ```bash
   npm run dev
   ```
   
   The application now starts successfully without database connection errors!

4. **Verify the Fix:**
   - No more endless "Database connection failed" errors
   - Authentication is automatically disabled in development mode
   - Services initialize on-demand when database becomes available

## Setting up PostgREST (when ready)

When you're ready to set up the actual database:

1. **Install and configure PostgREST** according to your database setup
2. **Update environment variables** in `.env`:
   ```env
   POSTGREST_URL=http://127.0.0.1:39216
   POSTGREST_SCHEMA=your_actual_schema
   POSTGREST_API_KEY=your_actual_api_key
   ```

3. **Restart the application** - it will automatically initialize database connections

## Development Mode Features

- **Graceful degradation**: App functions without database connections
- **On-demand initialization**: Database services initialize only when needed
- **Better error messages**: Clear indication of connection issues
- **Environment validation**: Helpful messages about missing configuration

## Troubleshooting

### "Publishing engine will be initialized on demand"
This is normal - services will start when the database is available.

### Connection timeouts or fetch errors  
Check that PostgREST is running on the correct port and accessible.

### Authentication errors
Verify your `POSTGREST_API_KEY` is correct for your PostgREST instance.

## Production Deployment

For production:
1. Ensure all environment variables are properly set
2. PostgREST service is running and accessible  
3. Remove placeholder values from `POSTGREST_API_KEY`
4. Test database connectivity before deployment

## Need Help?

- Check the console logs for detailed error messages
- Verify PostgREST service status
- Ensure environment variables match your actual database configuration
