
"use client";

import { BulkOperations } from "@/components/bulk/BulkOperations";

export default function BulkPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Operations</h1>
        <p className="text-muted-foreground">
          Import multiple posts from CSV or set up recurring content schedules
        </p>
      </div>

      <BulkOperations />
    </div>
  );
}
