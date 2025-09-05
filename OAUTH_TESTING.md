# Google OAuth Testing Checklist

This document outlines the testing process for the Google OAuth implementation with Supabase.

## Pre-Testing Setup

### 1. Verify Environment Configuration
- [x] NEXT_PUBLIC_SUPABASE_URL is set in .env
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY is set in .env
- [ ] Google OAuth is configured in Supabase project dashboard
- [ ] Authorized redirect URIs are set in Google Cloud Console
- [ ] Client ID and Secret are properly configured in Supabase

### 2. Required Supabase Configuration

In your Supabase project dashboard (https://app.supabase.com):
1. Go to Authentication > Settings > Auth Providers
2. Enable Google provider
3. Add your Google OAuth client ID and secret
4. Set redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`

### 3. Required Google Cloud Console Configuration

1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://[your-supabase-project].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local testing)

## Testing Scenarios

### 1. UI Component Tests
- [x] Google login button appears on login page
- [x] Google login button appears on register page
- [x] Button shows proper loading state during OAuth flow
- [x] Error messages display correctly for failed OAuth attempts

### 2. Authentication Flow Tests

#### Happy Path
- [ ] Click "Continue with Google" button
- [ ] Redirects to Google OAuth consent screen
- [ ] User grants permissions
- [ ] Redirects back to application
- [ ] User is successfully logged in
- [ ] User data is stored in database
- [ ] User is redirected to dashboard

#### Error Scenarios
- [ ] User cancels OAuth flow
- [ ] User denies permissions
- [ ] Network error during OAuth flow
- [ ] Database error during user creation
- [ ] Invalid OAuth configuration

### 3. Session Management Tests
- [ ] OAuth session persists across browser tabs
- [ ] OAuth session persists across page refreshes
- [ ] OAuth session expires appropriately
- [ ] Logout clears both local and Supabase sessions

### 4. Database Integration Tests
- [ ] New OAuth users are created in users table
- [ ] Existing users are updated with OAuth data
- [ ] User activities are logged for OAuth events
- [ ] Profile data is properly stored (avatar, name, etc.)

### 5. Error Handling Tests
- [ ] OAuth provider errors are handled gracefully
- [ ] Auth exchange failures are handled
- [ ] Database errors during OAuth are handled
- [ ] Network timeouts are handled
- [ ] Invalid tokens are handled

## Manual Testing Steps

### 1. Test New User Registration via Google OAuth
1. Clear browser cookies and local storage
2. Navigate to `/login`
3. Click "Continue with Google"
4. Complete Google OAuth flow with a new Google account
5. Verify user is created in database
6. Verify user is redirected to dashboard
7. Verify user session is active

### 2. Test Existing User Login via Google OAuth
1. Use the same Google account from step 1
2. Clear session/logout
3. Navigate to `/login`
4. Click "Continue with Google"
5. Verify user is logged in without creating duplicate
6. Verify user profile is updated with latest OAuth data

### 3. Test Error Scenarios
1. Simulate OAuth cancellation
2. Test with invalid OAuth configuration
3. Test with network disconnection
4. Verify error messages are user-friendly

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch" error
- **Cause**: Redirect URI not configured in Google Cloud Console
- **Solution**: Add the exact callback URL to authorized redirect URIs

### Issue: "OAuth provider not found" error
- **Cause**: Google provider not enabled in Supabase
- **Solution**: Enable Google provider in Supabase auth settings

### Issue: User stuck in loading state
- **Cause**: Callback route not handling sessions properly
- **Solution**: Check auth callback route implementation

### Issue: Database errors during OAuth
- **Cause**: Missing user table or incorrect permissions
- **Solution**: Verify database schema and RLS policies

## Testing Tools

- Browser DevTools (Network tab for OAuth requests)
- Supabase Dashboard (Auth logs)
- Database query tool (to verify user creation)
- Network simulation tools (for error testing)

## Automated Tests (Future)

Consider implementing:
- Unit tests for OAuth utility functions
- Integration tests for auth flow
- E2E tests with tools like Playwright
- API endpoint tests for auth callbacks
