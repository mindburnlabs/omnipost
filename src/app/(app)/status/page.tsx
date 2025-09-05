
"use client";

import { StatusPage } from "@/components/status/StatusPage";

export default function StatusPageRoute() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Status</h1>
        <p className="text-muted-foreground">
          Real-time status of OmniPost services and integrations
        </p>
      </div>

      <StatusPage />
    </div>
  );
}
