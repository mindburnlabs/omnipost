
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  TrendingUp, 
  Zap, 
  Calendar,
  Globe,
  Target,
  RefreshCw
} from "lucide-react";
import { postingTimeApi } from "@/lib/omnipost-api";
import { BestTime, BestTimeDTO } from "@/types/omnipost";
import { toast } from "sonner";

interface BestTimeApplicatorProps {
  onApplyTime: (date: Date) => void;
  selectedPlatforms: number[];
  userTimezone?: string;
}

// Helper function to normalize BestTime data
function normalizeBestTime(dto: BestTimeDTO): BestTime {
  return {
    ...dto,
    confidence: dto.confidence ?? 'medium', // Default to 'medium' if not provided
  };
}

export function BestTimeApplicator({ 
  onApplyTime, 
  selectedPlatforms,
  userTimezone = 'UTC'
}: BestTimeApplicatorProps) {
  const [bestTimes, setBestTimes] = useState<BestTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(userTimezone);

  const fetchBestTimes = useCallback(async () => {
    setLoading(true);
    try {
      const platform = selectedPlatforms.length === 1 ? getPlatformType(selectedPlatforms[0] || 0) : undefined;
      const timesDTO = await postingTimeApi.getBestTimes(platform, selectedTimezone);
      
      // Normalize the data to ensure confidence is always a string
      const normalized = timesDTO.slice(0, 2).map(normalizeBestTime);
      setBestTimes(normalized);
    } catch (error) {
      console.group('getBestTimes failed in BestTimeApplicator');
      console.error('Error details:', error);
      if (error && typeof error === 'object' && 'status' in error) {
        console.log('status', (error as any).status);
        console.log('url', (error as any).url);
        console.log('data', (error as any).data);
      }
      console.groupEnd();
      
      console.error('Failed to fetch best times:', error);
      toast.error('Failed to load best time recommendations');
    } finally {
      setLoading(false);
    }
  }, [selectedPlatforms, selectedTimezone]);

  useEffect(() => {
    fetchBestTimes();
  }, [fetchBestTimes]);

  const getPlatformType = (platformId: number): string => {
    switch (platformId) {
      case 1: return 'discord';
      case 2: return 'telegram';
      case 3: return 'whop';
      default: return 'general';
    }
  };

  const applyBestTime = (bestTime: BestTime) => {
    try {
      // Calculate next occurrence of this day/time
      const now = new Date();
      const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(bestTime.day);
      const [timeStr, period] = bestTime.time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      let targetHour = hours;
      if (period === 'PM' && hours !== 12) targetHour += 12;
      if (period === 'AM' && hours === 12) targetHour = 0;

      // Find next occurrence
      const nextDate = new Date(now);
      const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
      
      if (daysUntilTarget === 0) {
        // Same day - check if time has passed
        const todayAtTargetTime = new Date(now);
        todayAtTargetTime.setHours(targetHour, minutes || 0, 0, 0);
        
        if (todayAtTargetTime <= now) {
          // Time has passed, schedule for next week
          nextDate.setDate(now.getDate() + 7);
        }
      } else {
        nextDate.setDate(now.getDate() + daysUntilTarget);
      }
      
      nextDate.setHours(targetHour, minutes || 0, 0, 0);

      onApplyTime(nextDate);
      toast.success(`Scheduled for ${bestTime.localTime} (${bestTime.score}% engagement score)`);
    } catch (error) {
      console.error('Failed to apply best time:', error);
      toast.error('Failed to apply best time');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'medium':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Best Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
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
            Best Times
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="w-32">
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bestTimes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No timing data available yet</p>
              <p className="text-xs">Publish more content to get personalized recommendations</p>
            </div>
          ) : (
            bestTimes.map((time, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{time.day}</h4>
                      <span className="text-sm text-muted-foreground">{time.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{time.localTime}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getScoreColor(time.score)}>
                      {time.score}% engagement
                    </Badge>
                    <Badge className={getConfidenceColor(time.confidence)}>
                      {time.confidence} confidence
                    </Badge>
                  </div>
                </div>

                {time.engagementData.sampleSize > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="text-center">
                      <div className="font-medium">{time.engagementData.avgLikes}</div>
                      <div>Avg Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{time.engagementData.avgShares}</div>
                      <div>Avg Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{time.engagementData.avgComments}</div>
                      <div>Avg Comments</div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => applyBestTime(time)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Apply This Time
                </Button>
              </div>
            ))
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBestTimes}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
