
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { api, ApiError } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ENABLE_AUTH, DEFAULT_DEV_USER_ID } from "@/constants/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      await api.post('/auth/login', { email, password });
      await refreshUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, passcode: string)  => {
    try {
      await api.post('/auth/register', { 
        email, 
        password, 
        passcode, 
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (ENABLE_AUTH) {
        // Sign out from Supabase auth
        await supabase.auth.signOut();
        // Also logout from our custom auth system
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined' && ENABLE_AUTH) {
        router.push('/login');
      }
    }
  };

  const refreshUser = useCallback(async () => {
    if (!ENABLE_AUTH) {
      // Development mode - set mock user
      setUser({
        sub: DEFAULT_DEV_USER_ID.toString(),
        email: 'dev@omnipost.app',
        role: 'app20250904195901yvsuhcayno_v1_user',
        isAdmin: true
      });
      setIsLoading(false);
      return;
    }

    try {
      // First, check for Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Supabase session error:', sessionError);
      }
      
      // If we have a Supabase session but no local user, try to get user data
      if (session?.user && !user) {
        try {
          // Try to get user from our API first
          const userData = await api.get('/auth/user');
          setUser(userData);
          return;
        } catch (apiError) {
          // If API fails, create user object from Supabase data
          const supabaseUser = {
            sub: session.user.id,
            email: session.user.email || '',
            role: 'app20250904195901yvsuhcayno_v1_user',
            isAdmin: false
          };
          setUser(supabaseUser);
          return;
        }
      }
      
      // Try to get user from our API
      const userData = await api.get('/auth/user');
      setUser(userData);
    } catch (error) {
      if (error instanceof ApiError) {
        // Only log non-auth errors to avoid spam
        if (error.status !== 401) {
          console.error('Failed to fetch user:', error);
        }
      } else {
        console.error('Failed to fetch user:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen to Supabase auth state changes
  useEffect(() => {
    if (!ENABLE_AUTH) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in with OAuth - refresh user data
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear user data
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    googleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
