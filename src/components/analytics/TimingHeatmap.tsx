
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Globe, RefreshCw } from "lucide-react";
import { analyticsApi } from "@/lib/omnipost-api";
import { toast } from "sonner";

interface HeatmapData {
  day: number;
  hour: number;
  engagement: number;
  postCount: number;
}

export function TimingHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.getTimingHeatmap(
        selectedPlatform === 'all' ? undefined : selectedPlatform
      );
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
      toast.error('Failed to load timing heatmap');
      setHeatmapData([]); // No mock data fallback
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const getDayName = (day: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };

  const getHourLabel = (hour: number) => {
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  const getEngagementColor = (engagement: number, maxEngagement: number) => {
    if (maxEngagement === 0) return 'bg-gray-300';
    
    const intensity = engagement / maxEngagement;
    if (intensity >= 0.8) return 'bg-green-500';
    if (intensity >= 0.6) return 'bg-green-400';
    if (intensity >= 0.4) return 'bg-yellow-400';
    if (intensity >= 0.2) return 'bg-orange-400';
    return 'bg-gray-300';
  };

  const getEngagementIntensity = (engagement: number, maxEngagement: number) => {
    if (maxEngagement === 0) return { opacity: 0.3 };
    
    const intensity = Math.min(engagement / maxEngagement, 1);
    return {
      opacity: 0.3 + (intensity * 0.7)
    };
  };

  const getBestTimes = () => {
    if (heatmapData.length === 0) return [];
    
    const sortedData = [...heatmapData]
      .filter(d => d.postCount > 0) // Only include slots with actual posts
      .sort((a, b) => b.engagement - a.engagement);
    
    return sortedData.slice(0, 3);
  };

  const maxEngagement = Math.max(...heatmapData.map(d => d.engagement), 1);
  const bestTimes = getBestTimes();
  const totalPosts = heatmapData.reduce((sum, d) => sum + d.postCount, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Timing Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Timing Heatmap
            {totalPosts > 0 && (
              <Badge variant="outline">
                {totalPosts} posts analyzed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">EST</SelectItem>
                <SelectItem value="America/Los_Angeles">PST</SelectItem>
                <SelectItem value="Europe/London">GMT</SelectItem>
                <SelectItem value="Asia/Tokyo">JST</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="whop">Whop</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={fetchHeatmapData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalPosts === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No timing data available</p>
            <p className="text-sm">Publish more content to see your engagement patterns</p>
          </div>
        ) : (
          <>
            {/* Heatmap Grid */}
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">
                Engagement by Day & Hour ({selectedTimezone})
              </div>
              
              {/* Hour labels */}
              <div className="grid grid-cols-25 gap-1 mb-2">
                <div></div> {/* Empty corner */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="text-xs text-center text-muted-foreground">
                    {hour % 6 === 0 ? getHourLabel(hour) : ''}
                  </div>
                ))}
              </div>
              
              {/* Heatmap rows */}
              {Array.from({ length: 7 }, (_, day) => (
                <div key={day} className="grid grid-cols-25 gap-1">
                  <div className="text-xs text-muted-foreground flex items-center">
                    {getDayName(day)}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const dataPoint = heatmapData.find(d => d.day === day && d.hour === hour);
                    const engagement = dataPoint?.engagement || 0;
                    const postCount = dataPoint?.postCount || 0;
                    
                    return (
                      <div
                        key={hour}
                        className={`h-4 rounded-sm ${getEngagementColor(engagement, maxEngagement)} cursor-pointer hover:scale-110 transition-transform`}
                        style={getEngagementIntensity(engagement, maxEngagement)}
                        title={`${getDayName(day)} ${getHourLabel(hour)}: ${engagement} avg engagement (${postCount} posts)`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Less engagement</span>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-gray-300 rounded-sm"></div>
                <div className="h-3 w-3 bg-orange-400 rounded-sm"></div>
                <div className="h-3 w-3 bg-yellow-400 rounded-sm"></div>
                <div className="h-3 w-3 bg-green-400 rounded-sm"></div>
                <div className="h-3 w-3 bg-green-500 rounded-sm"></div>
              </div>
              <span>More engagement</span>
            </div>

            {/* Best Times Summary */}
            {bestTimes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Your Top Engagement Times
                </h4>
                <div className="space-y-2">
                  {bestTimes.map((time, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">
                        {getDayName(time.day)} at {getHourLabel(time.hour)} ({selectedTimezone})
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {time.engagement} avg engagement
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {time.postCount} posts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
