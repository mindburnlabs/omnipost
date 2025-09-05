import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.POSTGREST_URL?.replace('/rest/v1', '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.POSTGREST_API_KEY

// During build time, provide fallback values to prevent build failures
const buildTimeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const buildTimeKey = supabaseAnonKey || 'placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production' || process.env.DOCKER_BUILD === 'true') {
    console.warn('Supabase environment variables not found. Using fallback configuration for build.')
  } else {
    console.error('Supabase environment variables are required in production!')
  }
}

// Create Supabase client for auth operations
export const supabase = createClient(
  buildTimeUrl,
  buildTimeKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Type definitions for Supabase auth
export type SupabaseAuthUser = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
}

export type AuthProvider = 'google' | 'github' | 'discord'
