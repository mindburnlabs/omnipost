
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Eye, Trash2 } from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { Post } from "@/types/omnipost";
import { format, parseISO } from "date-fns";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function FailedPosts() {
  const [failedPosts, setFailedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<number | null>(null);

  useEffect(() => {
    const fetchFailedPosts = async () => {
      try {
        const posts = await postsApi.getAll({ status: 'failed' });
        setFailedPosts(posts);
      } catch (error) {
        console.error('Failed to fetch failed posts:', error);
        // Mock data for demo
        setFailedPosts([
          {
            id: 99,
            user_id: 1,
            title: "Failed Post Example",
            content: "This post failed to publish due to connection issues...",
            content_type: 'text',
            status: 'failed',
            metadata: { platforms: [1, 2], error: 'Connection timeout' },
            tags: ['failed', 'retry'],
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFailedPosts();
  }, []);

  const handleRetry = async (postId: number) => {
    try {
      setRetrying(postId);
      await api.post(`/posts/${postId}/retry`);
      
      // Remove from failed posts list
      setFailedPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post queued for retry');
    } catch (error) {
      console.error('Failed to retry post:', error);
      toast.error('Failed to retry post');
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await postsApi.delete(postId);
      setFailedPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Failed post deleted');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Failed Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Failed Posts
          <Badge variant="destructive" className="ml-auto">
            {failedPosts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {failedPosts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No failed posts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {post.title || 'Untitled Post'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {post.content.substring(0, 80)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive" className="text-xs">
                      Failed
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(post.updated_at), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  {post.metadata && typeof post.metadata === 'object' && 'error' in post.metadata && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Error: {String(post.metadata.error)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(post.id)}
                    disabled={retrying === post.id}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${retrying === post.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(post.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {failedPosts.length > 3 && (
              <Button variant="outline" size="sm" className="w-full">
                View All ({failedPosts.length - 3} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
