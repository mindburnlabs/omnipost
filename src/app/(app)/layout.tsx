
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ENABLE_AUTH } from "@/constants/auth";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ENABLE_AUTH && !isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (ENABLE_AUTH && (isLoading || !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
