
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ENABLE_AUTH } from "@/constants/auth";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showLanding, setShowLanding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log('Home page effect:', { isLoading, user: !!user, ENABLE_AUTH });
    
    // Force show landing page after a short delay to prevent loading issues
    const fallbackTimer = setTimeout(() => {
      if (!user) {
        console.log('Fallback: Showing landing page after timeout');
        setShowLanding(true);
      }
    }, 1500);

    if (!isLoading) {
      clearTimeout(fallbackTimer);
      
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
      
      // Auth is enabled but no user - show landing page immediately
      console.log('Auth enabled, no user, showing landing page');
      setShowLanding(true);
    }

    return () => clearTimeout(fallbackTimer);
  }, [router, user, isLoading, mounted]);

  // Don't render anything during hydration
  if (!mounted) {
    return null;
  }

  // Show landing page if explicitly set to show or if conditions are met
  if (showLanding || (ENABLE_AUTH && !user && !isLoading)) {
    return <LandingPage />;
  }

  // Show loading only briefly
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="text-muted-foreground">Loading OmniPost...</p>
        </div>
      </div>
    );
  }

  // Default fallback
  return <LandingPage />;
}
