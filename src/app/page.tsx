
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ENABLE_AUTH } from "@/constants/auth";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (ENABLE_AUTH && !user) {
        router.replace('/login');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [router, user, isLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
        <p className="text-muted-foreground">Loading OmniPost...</p>
      </div>
    </div>
  );
}
