
"use client";

import { ABTestManager } from "@/components/experiments/ABTestManager";

export default function ExperimentsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">A/B Experiments</h1>
        <p className="text-muted-foreground">
          Test different content approaches and promote winning variants
        </p>
      </div>

      <ABTestManager />
    </div>
  );
}
