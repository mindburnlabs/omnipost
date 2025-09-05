

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share,
  Calendar,
  Download
} from "lucide-react";
import { analyticsApi } from "@/lib/omnipost-api";
import { format, subDays } from "date-fns";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsApi.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Mock data for demo
        setDashboardData({
          totalReach: 12500,
          totalEngagement: 1850,
          totalClicks: 420,
          topPosts: [
            {
              id: 1,
              title: "Weekly Update",
              content: "This week's highlights...",
              engagement: 245,
              reach: 1200
            },
            {
              id: 2,
              title: "Product Launch",
              content: "Excited to announce...",
              engagement: 189,
              reach: 980
            }
          ],
          platformPerformance: [
            {
              platform: "discord",
              metrics: {
                reach: 5200,
                engagement: 780,
                clicks: 156
              }
            },
            {
              platform: "telegram",
              metrics: {
                reach: 4100,
                engagement: 620,
                clicks: 142
              }
            },
            {
              platform: "whop",
              metrics: {
                reach: 3200,
                engagement: 450,
                clicks: 122
              }
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'discord':
        return '🎮';
      case 'telegram':
        return '✈️';
      case 'whop':
        return '🛍️';
      default:
        return '📱';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your content performance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your content performance and engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={selectedPeriod === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('7d')}
            >
              7 days
            </Button>
            <Button
              variant={selectedPeriod === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('30d')}
            >
              30 days
            </Button>
            <Button
              variant={selectedPeriod === '90d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod('90d')}
            >
              90 days
            </Button>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold">{formatNumber(dashboardData?.totalReach || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Engagement</p>
                <p className="text-2xl font-bold">{formatNumber(dashboardData?.totalEngagement || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+8.2%</span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{formatNumber(dashboardData?.totalClicks || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Share className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+15.3%</span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.platformPerformance?.map((platform: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                  <div>
                    <h4 className="font-medium capitalize">{platform.platform}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(platform.metrics.reach)} reach
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{formatNumber(platform.metrics.engagement)}</span>
                    </div>
                    <p className="text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Share className="h-4 w-4 text-blue-500" />
                      <span>{formatNumber(platform.metrics.clicks)}</span>
                    </div>
                    <p className="text-muted-foreground">Clicks</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.topPosts?.map((post: any, index: number) => (
              <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{post.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {post.content}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span>{formatNumber(post.reach)}</span>
                    </div>
                    <p className="text-muted-foreground">Reach</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{formatNumber(post.engagement)}</span>
                    </div>
                    <p className="text-muted-foreground">Engagement</p>
                  </div>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

