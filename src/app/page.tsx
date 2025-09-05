
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

  useEffect(() => {
    if (!isLoading) {
      // If user is authenticated, redirect to dashboard
      if (user) {
        router.replace('/dashboard');
        return;
      }
      
      // If auth is disabled, redirect to dashboard
      if (!ENABLE_AUTH) {
        router.replace('/dashboard');
        return;
      }
      
      // Show landing page for unauthenticated users when auth is enabled
      setShowLanding(true);
    }
  }, [router, user, isLoading]);

  // Show loading spinner while determining what to display
  if (isLoading || (!showLanding && ENABLE_AUTH && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="text-muted-foreground">Loading OmniPost...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
