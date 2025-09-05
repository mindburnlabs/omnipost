
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ExternalLink } from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { Post } from "@/types/omnipost";
import { format, isToday, parseISO } from "date-fns";

export function TodaySchedule() {
  const [todayPosts, setTodayPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayPosts = async () => {
      try {
        const posts = await postsApi.getAll({ status: 'scheduled' });
        const today = posts.filter(post => 
          post.scheduled_at && isToday(parseISO(post.scheduled_at))
        );
        setTodayPosts(today.sort((a, b) => 
          new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
        ));
      } catch (error) {
        console.error('Failed to fetch today posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayPosts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Schedule
          <Badge variant="secondary" className="ml-auto">
            {todayPosts.length} posts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No posts scheduled for today</p>
            <Button variant="outline" size="sm" className="mt-2">
              Schedule a Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {todayPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {post.scheduled_at && format(parseISO(post.scheduled_at), 'HH:mm')}
                    </span>
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.title || post.content.substring(0, 100) + '...'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {post.content_type}
                    </Badge>
                    {post.tags && post.tags.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {post.tags.length} tags
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
