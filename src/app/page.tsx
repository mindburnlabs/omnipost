
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ENABLE_AUTH } from "@/constants/auth";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    console.log('Home page effect:', { isLoading, user: !!user, ENABLE_AUTH });
    
    // Set a timeout to ensure we don't get stuck in loading state
    const timeout = setTimeout(() => {
      console.log('Timeout reached, showing landing page');
      setInitialLoad(false);
    }, 3000); // 3 second timeout

    if (!isLoading) {
      clearTimeout(timeout);
      
      // If user is authenticated, redirect to dashboard
      if (user) {
        console.log('User authenticated, redirecting to dashboard');
        router.replace('/dashboard');
        return;
      }
      
      // If auth is disabled, redirect to dashboard
      if (!ENABLE_AUTH) {
        console.log('Auth disabled, redirecting to dashboard');
        router.replace('/dashboard');
        return;
      }
      
      // Auth is enabled but no user - show landing page
      console.log('Auth enabled, no user, showing landing page');
      setInitialLoad(false);
    }

    return () => clearTimeout(timeout);
  }, [router, user, isLoading]);

  // Show loading spinner only for a short time
  if (isLoading && initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="text-muted-foreground">Loading OmniPost...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users when auth is enabled
  if (ENABLE_AUTH && !user) {
    return <LandingPage />;
  }

  // Fallback - should not reach here, but show landing page anyway
  return <LandingPage />;
}
