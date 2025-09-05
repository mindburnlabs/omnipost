
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  Eye
} from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { Post } from "@/types/omnipost";
import { format, parseISO } from "date-fns";
import Link from "next/link";

export default function LibraryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsApi.getAll();
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Development data for library demonstration
        const samplePosts: Post[] = [
          {
            id: 1,
            user_id: 1,
            title: "Weekly Update",
            content: "This week's highlights and upcoming events...",
            content_type: 'text',
            status: 'published',
            published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            metadata: {},
            tags: ['launch', 'product'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 3,
            user_id: 1,
            title: "Draft Post",
            content: "This is a draft post that needs to be completed...",
            content_type: 'text',
            status: 'draft',
            metadata: {},
            tags: ['draft'],
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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = activeTab === 'all' || post.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await postsApi.delete(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Library</h1>
            <p className="text-muted-foreground">Manage all your content</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
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
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Manage all your content in one place
          </p>
        </div>
        <Button asChild>
          <Link href="/composer">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first post to get started'}
                </p>
                <Button asChild>
                  <Link href="/composer">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {post.title || 'Untitled Post'}
                          </h3>
                          <Badge className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                          <Badge variant="outline">
                            {post.content_type}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {post.published_at 
                                ? `Published ${format(parseISO(post.published_at), 'MMM dd, yyyy')}`
                                : post.scheduled_at
                                ? `Scheduled for ${format(parseISO(post.scheduled_at), 'MMM dd, yyyy')}`
                                : `Created ${format(parseISO(post.created_at), 'MMM dd, yyyy')}`
                              }
                            </span>
                          </div>
                          
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span>Tags:</span>
                              {post.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs">+{post.tags.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
