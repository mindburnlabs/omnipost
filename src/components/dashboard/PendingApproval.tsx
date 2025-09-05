
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { Post } from "@/types/omnipost";

export function PendingApproval() {
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingPosts = async () => {
      try {
        const posts = await postsApi.getAll({ status: 'draft' });
        // Filter posts that need approval (have scheduled_at but are still draft)
        const pending = posts.filter(post => 
          post.scheduled_at && post.status === 'draft'
        );
        setPendingPosts(pending);
      } catch (error) {
        console.error('Failed to fetch pending posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPosts();
  }, []);

  const handleApprove = async (postId: number) => {
    try {
      await postsApi.update(postId, { status: 'scheduled' });
      setPendingPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to approve post:', error);
    }
  };

  const handleReject = async (postId: number) => {
    try {
      await postsApi.update(postId, { status: 'draft', scheduled_at: undefined });
      setPendingPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to reject post:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Approval
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
          <AlertCircle className="h-5 w-5" />
          Pending Approval
          <Badge variant="secondary" className="ml-auto">
            {pendingPosts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingPosts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All posts approved!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {post.title || 'Untitled Post'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {post.content.substring(0, 80)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {post.content_type}
                    </Badge>
                    {post.scheduled_at && (
                      <Badge variant="outline" className="text-xs">
                        Scheduled
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(post.id)}
                    className="h-8 w-8 p-0"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(post.id)}
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {pendingPosts.length > 3 && (
              <Button variant="outline" size="sm" className="w-full">
                View All ({pendingPosts.length - 3} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
