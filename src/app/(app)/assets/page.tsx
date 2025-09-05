
"use client";

import { AssetManager } from "@/components/assets/AssetManager";

export default function AssetsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Asset Library</h1>
        <p className="text-muted-foreground">
          Manage your images, videos, and files for social media content
        </p>
      </div>

      <AssetManager />
    </div>
  );
}
