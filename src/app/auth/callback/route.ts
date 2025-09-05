import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import CrudOperations from '@/lib/crud-operations'
import { generateAdminUserToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth provider error:', error, errorDescription)
    const errorMessage = encodeURIComponent(errorDescription || 'OAuth authentication failed')
    return NextResponse.redirect(`${origin}/login?error=oauth_provider_error&message=${errorMessage}`)
  }

  if (code) {
    try {
      // Exchange the code for a session
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('Auth exchange error:', authError)
        const errorMessage = encodeURIComponent(authError.message || 'Authentication failed')
        return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed&message=${errorMessage}`)
      }

      if (session?.user) {
        try {
          // Create or update user in our database
          const usersCrud = new CrudOperations('users') // Use service role key only
          const activitiesCrud = new CrudOperations('user_activities')

          // Check if user exists
          const existingUsers = await usersCrud.findMany({ email: session.user.email })
          let user = existingUsers[0]

          if (!user) {
            // Create new user for Google OAuth
            const userData = {
              email: session.user.email,
              password: 'OAUTH_USER', // OAuth users don't need passwords
              role: 'app20250904195901yvsuhcayno_v1_user',
              profile: {
                username: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                avatar_url: session.user.user_metadata?.avatar_url,
                provider: 'google',
                provider_id: session.user.id,
                source: 'google_oauth'
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            user = await usersCrud.create(userData)
            
            // Log user creation activity
            await activitiesCrud.create({
              user_id: user.id,
              activity_type: 'user_created',
              activity_description: 'User created via Google OAuth',
              metadata: {
                provider: 'google',
                provider_id: session.user.id,
                email: session.user.email
              },
              created_at: new Date().toISOString()
            })
          } else {
            // Update existing user with latest OAuth info
            const updatedProfile = {
              ...user.profile,
              avatar_url: session.user.user_metadata?.avatar_url,
              last_google_login: new Date().toISOString(),
              provider: 'google',
              provider_id: session.user.id
            }

            await usersCrud.update(user.id, {
              profile: updatedProfile,
              updated_at: new Date().toISOString()
            })

            // Log login activity
            await activitiesCrud.create({
              user_id: user.id,
              activity_type: 'google_login',
              activity_description: 'User signed in via Google',
              metadata: {
                provider: 'google',
                provider_id: session.user.id,
                email: session.user.email
              },
              created_at: new Date().toISOString()
            })
          }

          // Set session cookies and redirect to dashboard
          const response = NextResponse.redirect(`${origin}/dashboard`)
          
          // Set auth cookies for our app to recognize the user
          response.cookies.set('supabase-auth-token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
          
          response.cookies.set('user-id', user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })

          return response
        } catch (dbError: any) {
          console.error('Database error during Google auth:', dbError)
          const errorMessage = encodeURIComponent(dbError?.message || 'Database error occurred during authentication')
          return NextResponse.redirect(`${origin}/login?error=database_error&message=${errorMessage}`)
        }
      }
    } catch (error: any) {
      console.error('Google OAuth callback error:', error)
      const errorMessage = encodeURIComponent(error?.message || 'OAuth callback error')
      return NextResponse.redirect(`${origin}/login?error=oauth_error&message=${errorMessage}`)
    }
  }

  // No code found, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=no_code&message=No%20authorization%20code%20received`)
}
