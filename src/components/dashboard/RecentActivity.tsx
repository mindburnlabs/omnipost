
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MessageSquare, Calendar, Upload, Settings } from "lucide-react";
import { userActivitiesApi } from "@/lib/omnipost-api";
import { UserActivity } from "@/types/omnipost";
import { formatDistanceToNow, parseISO } from "date-fns";

export function RecentActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await userActivitiesApi.getRecent(10);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        // Mock data for demo
        setActivities([
          {
            id: 1,
            user_id: 1,
            activity_type: 'post_created',
            activity_description: 'Created new post "Weekly Update"',
            related_entity_type: 'post',
            related_entity_id: 123,
            metadata: {},
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          },
          {
            id: 2,
            user_id: 1,
            activity_type: 'post_scheduled',
            activity_description: 'Scheduled post for Discord and Telegram',
            related_entity_type: 'post',
            related_entity_id: 122,
            metadata: {},
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          {
            id: 3,
            user_id: 1,
            activity_type: 'asset_uploaded',
            activity_description: 'Uploaded new image "banner.jpg"',
            related_entity_type: 'asset',
            related_entity_id: 45,
            metadata: {},
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_created':
      case 'post_updated':
        return MessageSquare;
      case 'post_scheduled':
      case 'post_published':
        return Calendar;
      case 'asset_uploaded':
        return Upload;
      case 'settings_updated':
        return Settings;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post_created':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'post_scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'post_published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'asset_uploaded':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
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
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.activity_type);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      {activity.activity_description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getActivityColor(activity.activity_type)} variant="secondary">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
