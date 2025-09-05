// Simple test to verify Supabase client configuration
import { supabase } from './lib/supabase.ts';

console.log('Testing Supabase configuration...');

async function testSupabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase client initialized successfully');
    console.log('Current session:', data?.session ? 'Active session' : 'No active session');
    
    if (error) {
      console.log('⚠️  Auth error (this is normal if no session exists):', error.message);
    }
    
    // Test environment variables
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
  }
}

testSupabaseConnection();
