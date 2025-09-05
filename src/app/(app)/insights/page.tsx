
"use client";

import { TimingHeatmap } from "@/components/analytics/TimingHeatmap";
import { ContentInsights } from "@/components/analytics/ContentInsights";
import { PerformanceInsights } from "@/components/insights/PerformanceInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InsightsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Insights</h1>
        <p className="text-muted-foreground">
          AI-powered insights to optimize your content strategy
        </p>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <PerformanceInsights />
        </TabsContent>

        <TabsContent value="timing">
          <TimingHeatmap />
        </TabsContent>

        <TabsContent value="content">
          <ContentInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}
