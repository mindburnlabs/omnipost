
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock, 
  User,
  AlertCircle,
  Edit,
  Send
} from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { Post } from "@/types/omnipost";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface ApprovalRequest {
  id: number;
  post: Post;
  requester: {
    name: string;
    email: string;
  };
  comments: Array<{
    id: number;
    author: string;
    message: string;
    timestamp: string;
    type: 'comment' | 'approval' | 'rejection' | 'changes_requested';
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  created_at: string;
  sla_deadline?: string;
}

export function ApprovalWorkflow() {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      // In a real app, you'd have an approvals API endpoint
      const posts = await postsApi.getAll({ status: 'draft' });
      
      // Sample approval requests
      const sampleRequests: ApprovalRequest[] = posts
        .filter(post => post.scheduled_at) // Posts that are scheduled but need approval
        .map(post => ({
          id: post.id,
          post,
          requester: {
            name: 'Content Creator',
            email: 'creator@omnipost.app'
          },
          comments: [
            {
              id: 1,
              author: 'Content Creator',
              message: 'Ready for review - scheduled for tomorrow morning',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              type: 'comment'
            }
          ],
          status: 'pending',
          created_at: post.created_at,
          sla_deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours SLA
        }));

      setApprovalRequests(sampleRequests);
    } catch (error) {
      console.error('Failed to fetch approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const request = approvalRequests.find(r => r.id === requestId);
      if (!request) return;

      await postsApi.update(request.post.id, { status: 'scheduled' });
      
      setApprovalRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              status: 'approved',
              comments: [...r.comments, {
                id: Date.now(),
                author: 'Approver',
                message: comment || 'Approved for publishing',
                timestamp: new Date().toISOString(),
                type: 'approval'
              }]
            }
          : r
      ));
      
      setComment("");
      toast.success("Post approved successfully!");
    } catch (error) {
      console.error('Failed to approve post:', error);
      toast.error("Failed to approve post");
    }
  };

  const handleReject = async (requestId: number) => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const request = approvalRequests.find(r => r.id === requestId);
      if (!request) return;

      await postsApi.update(request.post.id, { 
        status: 'draft',
        scheduled_at: undefined 
      });
      
      setApprovalRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              status: 'rejected',
              comments: [...r.comments, {
                id: Date.now(),
                author: 'Approver',
                message: comment,
                timestamp: new Date().toISOString(),
                type: 'rejection'
              }]
            }
          : r
      ));
      
      setComment("");
      toast.success("Post rejected with feedback");
    } catch (error) {
      console.error('Failed to reject post:', error);
      toast.error("Failed to reject post");
    }
  };

  const handleRequestChanges = async (requestId: number) => {
    if (!comment.trim()) {
      toast.error("Please provide specific change requests");
      return;
    }

    try {
      setApprovalRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              status: 'changes_requested',
              comments: [...r.comments, {
                id: Date.now(),
                author: 'Approver',
                message: comment,
                timestamp: new Date().toISOString(),
                type: 'changes_requested'
              }]
            }
          : r
      ));
      
      setComment("");
      toast.success("Change requests sent to creator");
    } catch (error) {
      console.error('Failed to request changes:', error);
      toast.error("Failed to request changes");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'changes_requested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Approval Queue
            <Badge variant="secondary" className="ml-auto">
              {approvalRequests.filter(r => r.status === 'pending').length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts pending approval</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalRequests.map((request) => (
                <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {request.requester.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {request.post.title || 'Untitled Post'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {request.requester.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        {isOverdue(request.sla_deadline) && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {request.post.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {request.post.scheduled_at 
                            ? `Scheduled for ${format(parseISO(request.post.scheduled_at), 'MMM dd, HH:mm')}`
                            : `Created ${format(parseISO(request.created_at), 'MMM dd, HH:mm')}`
                          }
                        </span>
                        {request.sla_deadline && (
                          <span className={isOverdue(request.sla_deadline) ? 'text-red-600' : ''}>
                            • SLA: {format(parseISO(request.sla_deadline), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Review Panel */}
      {selectedRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Review: {selectedRequest.post.title || 'Untitled Post'}
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Post Content */}
            <div className="space-y-3">
              <h4 className="font-medium">Post Content</h4>
              <div className="p-4 bg-muted/50 rounded-lg">
                {selectedRequest.post.title && (
                  <h5 className="font-semibold mb-2">{selectedRequest.post.title}</h5>
                )}
                <p className="whitespace-pre-wrap">{selectedRequest.post.content}</p>
                {selectedRequest.post.tags && selectedRequest.post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedRequest.post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments & History
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedRequest.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {comment.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <Badge variant="outline" className="text-xs">
                          {comment.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(comment.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Review Actions */}
            {selectedRequest.status === 'pending' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Comment (Optional)</label>
                  <Textarea
                    placeholder="Add feedback, suggestions, or approval notes..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRequestChanges(selectedRequest.id)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedRequest.id)}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {selectedRequest.status !== 'pending' && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This post has been {selectedRequest.status.replace('_', ' ')}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
