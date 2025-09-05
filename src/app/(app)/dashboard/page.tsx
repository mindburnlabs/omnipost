
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { PendingApproval } from "@/components/dashboard/PendingApproval";
import { BestTimesToPost } from "@/components/dashboard/BestTimesToPost";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PlatformStatus } from "@/components/dashboard/PlatformStatus";
import { FailedPosts } from "@/components/dashboard/FailedPosts";
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your content.
          </p>
        </div>
        <Button asChild>
          <Link href="/composer">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Onboarding Flow */}
      <OnboardingFlow />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule />
          <BestTimesToPost />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <SystemHealth />
          <FailedPosts />
          <PendingApproval />
          <PlatformStatus />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
