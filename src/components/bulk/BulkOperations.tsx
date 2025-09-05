
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { postsApi } from "@/lib/omnipost-api";
import { toast } from "sonner";

interface BulkPost {
  title?: string;
  content: string;
  scheduled_at?: string;
  platforms: string[];
  tags: string[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export function BulkOperations() {
  const [bulkPosts, setBulkPosts] = useState<BulkPost[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvContent, setCsvContent] = useState("");
  const [recurringTemplate, setRecurringTemplate] = useState({
    content: "",
    frequency: "weekly",
    platforms: [] as string[],
    tags: [] as string[]
  });

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      setCsvContent(csv);
      parseCSV(csv);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string) => {
    try {
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
      
      const posts: BulkPost[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]?.split(',').map(v => v.trim()) || [];
        const post: BulkPost = {
          content: '',
          platforms: [],
          tags: [],
          status: 'pending'
        };

        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          switch (header) {
            case 'title':
              post.title = value;
              break;
            case 'content':
              post.content = value;
              break;
            case 'scheduled_at':
            case 'schedule':
              post.scheduled_at = value;
              break;
            case 'platforms':
              post.platforms = value.split(';').map(p => p.trim()).filter(Boolean);
              break;
            case 'tags':
              post.tags = value.split(';').map(t => t.trim()).filter(Boolean);
              break;
          }
        });

        if (post.content) {
          posts.push(post);
        }
      }

      setBulkPosts(posts);
      toast.success(`Parsed ${posts.length} posts from CSV`);
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };

  const handleBulkProcess = async () => {
    if (bulkPosts.length === 0) {
      toast.error("No posts to process");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < bulkPosts.length; i++) {
        const post = bulkPosts[i];
        if (!post) continue;
        
        // Update status to processing
        setBulkPosts(prev => prev.map((p, index) => 
          index === i ? { ...p, status: 'processing' } : p
        ));

        try {
          await postsApi.create({
            title: post.title,
            content: post.content,
            status: post.scheduled_at ? 'scheduled' : 'draft',
            scheduled_at: post.scheduled_at,
            tags: post.tags,
            metadata: {
              platforms: post.platforms,
              bulk_import: true
            }
          });

          // Update status to completed
          setBulkPosts(prev => prev.map((p, index) => 
            index === i ? { ...p, status: 'completed' } : p
          ));
        } catch (error) {
          // Update status to failed
          setBulkPosts(prev => prev.map((p, index) => 
            index === i ? { 
              ...p, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Unknown error'
            } : p
          ));
        }

        setProgress(((i + 1) / bulkPosts.length) * 100);
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const completed = bulkPosts.filter(p => p.status === 'completed').length;
      const failed = bulkPosts.filter(p => p.status === 'failed').length;
      
      toast.success(`Bulk import completed: ${completed} successful, ${failed} failed`);
    } catch (error) {
      console.error('Bulk processing error:', error);
      toast.error('Bulk processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportTemplate = () => {
    const csvTemplate = `title,content,scheduled_at,platforms,tags
"Weekly Update","This week's highlights and upcoming events...","2024-01-15 10:00:00","discord;telegram","update;weekly"
"Product Launch","Excited to announce our new product!","2024-01-16 14:00:00","discord;telegram;whop","launch;product;announcement"
"Community Question","What's your favorite productivity tip?","","discord","question;community;productivity"`;

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omnipost-bulk-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="csv-import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="csv-import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV Import
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Calendar className="h-4 w-4 mr-2" />
            Recurring Posts
          </TabsTrigger>
        </TabsList>

        {/* CSV Import */}
        <TabsContent value="csv-import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import from CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with columns: title, content, scheduled_at, platforms, tags
                  <Button variant="link" className="p-0 h-auto ml-2" onClick={handleExportTemplate}>
                    <Download className="h-3 w-3 mr-1" />
                    Download Template
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={processing}
                />
              </div>

              {bulkPosts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Parsed Posts ({bulkPosts.length})
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setBulkPosts([])}
                        disabled={processing}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={handleBulkProcess}
                        disabled={processing}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Import All
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {processing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing posts...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {bulkPosts.map((post, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(post.status || 'pending')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {post.title && (
                              <span className="font-medium text-sm">{post.title}</span>
                            )}
                            <Badge className={getStatusColor(post.status || 'pending')}>
                              {post.status || 'pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                          {post.error && (
                            <p className="text-xs text-red-600 mt-1">
                              Error: {post.error}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {post.platforms.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {post.platforms.length} platforms
                              </Badge>
                            )}
                            {post.tags.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {post.tags.length} tags
                              </Badge>
                            )}
                            {post.scheduled_at && (
                              <Badge variant="outline" className="text-xs">
                                Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Posts */}
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recurring Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Set up posts that automatically repeat on a schedule. Perfect for weekly updates, daily tips, or monthly newsletters.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recurring-content">Content Template</Label>
                  <Textarea
                    id="recurring-content"
                    placeholder="Enter your recurring post content. Use [DATE], [WEEK], [MONTH] as placeholders..."
                    value={recurringTemplate.content}
                    onChange={(e) => setRecurringTemplate(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={recurringTemplate.frequency}
                      onChange={(e) => setRecurringTemplate(prev => ({ ...prev, frequency: e.target.value }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="datetime-local" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Platforms (comma-separated)</Label>
                  <Input
                    placeholder="discord, telegram, whop"
                    onChange={(e) => setRecurringTemplate(prev => ({ 
                      ...prev, 
                      platforms: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="weekly, update, recurring"
                    onChange={(e) => setRecurringTemplate(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <Button 
                  onClick={() => toast.info('Recurring posts feature coming soon!')}
                  disabled={!recurringTemplate.content.trim()}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Recurring Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
