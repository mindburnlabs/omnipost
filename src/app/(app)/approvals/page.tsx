
"use client";

import { ApprovalWorkflow } from "@/components/approval/ApprovalWorkflow";

export default function ApprovalsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve content before it goes live
        </p>
      </div>

      <ApprovalWorkflow />
    </div>
  );
}
