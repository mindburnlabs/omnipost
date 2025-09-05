
"use client";

import { BrandKitManager } from "@/components/brand/BrandKitManager";

export default function BrandPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Brand Management</h1>
        <p className="text-muted-foreground">
          Manage your brand guidelines, colors, and messaging consistency
        </p>
      </div>

      <BrandKitManager />
    </div>
  );
}
