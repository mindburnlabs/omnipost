
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { api, ApiError } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { ENABLE_AUTH, DEFAULT_DEV_USER_ID } from "@/constants/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const logout = async () => {
    try {
      if (ENABLE_AUTH) {
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
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
