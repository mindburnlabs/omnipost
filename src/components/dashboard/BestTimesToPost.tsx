
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, TrendingUp, Calendar, Globe, Zap } from "lucide-react";
import { postingTimeApi } from "@/lib/omnipost-api";
import { BestTime, BestTimeDTO } from "@/types/omnipost";
import { toast } from "sonner";

// Helper function to normalize BestTime data
function normalizeBestTime(dto: BestTimeDTO): BestTime {
  return {
    ...dto,
    confidence: dto.confidence ?? 'medium', // Default to 'medium' if not provided
  };
}

export function BestTimesToPost() {
  const [bestTimes, setBestTimes] = useState<BestTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [updating, setUpdating] = useState(false);

  const fetchBestTimes = useCallback(async () => {
    try {
      const timesDTO = await postingTimeApi.getBestTimes(undefined, selectedTimezone);
      
      // Normalize the data to ensure confidence is always a string
      const normalized = timesDTO.slice(0, 2).map(normalizeBestTime);
      setBestTimes(normalized);
    } catch (error) {
      console.group('getBestTimes failed');
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
  }, [selectedTimezone]);

  useEffect(() => {
    fetchBestTimes();
  }, [fetchBestTimes]);

  const handleUpdateRecommendations = async () => {
    setUpdating(true);
    try {
      await postingTimeApi.updateRecommendations(selectedTimezone);
      await fetchBestTimes();
      toast.success('Recommendations updated based on your latest data!');
    } catch (error) {
      console.error('Failed to update recommendations:', error);
      toast.error('Failed to update recommendations');
    } finally {
      setUpdating(false);
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
            Best Times to Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
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
            Best Times to Post
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
        <div className="space-y-4">
          {bestTimes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No timing data available yet</p>
              <p className="text-sm mb-4">Publish more content to get personalized recommendations</p>
              <Button variant="outline" onClick={handleUpdateRecommendations} disabled={updating}>
                {updating ? 'Analyzing...' : 'Analyze My Data'}
              </Button>
            </div>
          ) : (
            <>
              {bestTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{time.day}</p>
                      <p className="text-sm text-muted-foreground">{time.localTime}</p>
                      {time.engagementData.sampleSize > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Based on {time.engagementData.sampleSize} posts
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Badge className={getScoreColor(time.score)}>
                        {time.score}% engagement
                      </Badge>
                      <div className="mt-1">
                        <Badge className={getConfidenceColor(time.confidence)} variant="outline">
                          {time.confidence} confidence
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/composer?schedule=${time.day}&time=${time.time}&timezone=${time.timezone}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleUpdateRecommendations}
                  disabled={updating}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {updating ? 'Updating...' : 'Refresh Data'}
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href="/insights?tab=timing">
                    View All Recommendations
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
