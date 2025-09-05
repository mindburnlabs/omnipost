
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit } from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { Post } from "@/types/omnipost";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday
} from "date-fns";
import Link from "next/link";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsApi.getAll({ status: 'scheduled' });
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Development data for calendar demonstration
        const samplePosts: Post[] = [
          {
            id: 1,
            user_id: 1,
            title: "Weekly Update",
            content: "This week's highlights and upcoming events...",
            content_type: 'text',
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            metadata: {},
            tags: ['update', 'weekly'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            user_id: 1,
            title: "Product Launch",
            content: "Excited to announce our new product launch!",
            content_type: 'text',
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
            metadata: {},
            tags: ['launch', 'product'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setPosts(samplePosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => 
      post.scheduled_at && isSameDay(parseISO(post.scheduled_at), day)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Calendar</h1>
            <p className="text-muted-foreground">Manage your scheduled content</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">
            Manage your scheduled content and plan ahead
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
          <Button asChild>
            <Link href="/composer">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map(day => {
              const dayPosts = getPostsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[120px] p-2 border rounded-lg transition-colors
                    ${isCurrentMonth ? 'bg-card' : 'bg-muted/50'}
                    ${isDayToday ? 'ring-2 ring-primary' : ''}
                    hover:bg-muted/80
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-2
                    ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                    ${isDayToday ? 'text-primary font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map(post => (
                      <div
                        key={post.id}
                        className="p-1 rounded text-xs bg-background border cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-1">
                          <Badge className={getStatusColor(post.status)} variant="secondary">
                            {post.scheduled_at && format(parseISO(post.scheduled_at), 'HH:mm')}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 mt-1">
                          {post.title || post.content.substring(0, 30) + '...'}
                        </p>
                      </div>
                    ))}
                    
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No scheduled posts</p>
              <Button variant="outline" asChild>
                <Link href="/composer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 5).map(post => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {post.title || 'Untitled Post'}
                      </h4>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.scheduled_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(post.scheduled_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {post.tags.length} tags
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
