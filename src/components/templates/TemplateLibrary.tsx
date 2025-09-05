
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Plus, 
  Star, 
  Copy, 
  Trash2,
  Megaphone,
  Gift,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import { contentTemplatesApi } from "@/lib/omnipost-api";
import { ContentTemplate } from "@/types/omnipost";
import { toast } from "sonner";

interface TemplateLibraryProps {
  onUseTemplate?: (contentTemplate: ContentTemplate) => void;
}

type TemplateType = "general" | "announcement" | "promotion" | "update" | "question";

export function TemplateLibrary({ onUseTemplate }: TemplateLibraryProps) {
  const [contentTemplates, setContentTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newContentTemplate, setNewContentTemplate] = useState<{
    name: string;
    description: string;
    template_content: string;
    template_type: TemplateType;
  }>({
    name: "",
    description: "",
    template_content: "",
    template_type: "general"
  });

  useEffect(() => {
    fetchContentTemplates();
  }, []);

  const fetchContentTemplates = async () => {
    try {
      const data = await contentTemplatesApi.getAll();
      setContentTemplates(data);
    } catch (error) {
      console.error('Failed to fetch content templates:', error);
      // Sample content templates for demo
      setContentTemplates([
        {
          id: 1,
          user_id: 1,
          name: "Weekly Update",
          description: "Content template for weekly team updates",
          template_content: "🗓️ **Weekly Update - [Week of DATE]**\n\n📈 **This Week's Highlights:**\n• [Achievement 1]\n• [Achievement 2]\n• [Achievement 3]\n\n🎯 **Next Week's Focus:**\n• [Goal 1]\n• [Goal 2]\n\n💬 Questions? Drop them below! 👇",
          template_type: "update",
          platform_specific: {},
          usage_count: 15,
          is_favorite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          user_id: 1,
          name: "Product Launch",
          description: "Announcement content template for new product launches",
          template_content: "🚀 **Exciting News!**\n\nWe're thrilled to announce [PRODUCT NAME] - [BRIEF DESCRIPTION]\n\n✨ **Key Features:**\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n🎉 **Special Launch Offer:** [OFFER DETAILS]\n\n👉 Get started: [LINK]\n\n#ProductLaunch #Innovation",
          template_type: "announcement",
          platform_specific: {},
          usage_count: 8,
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          user_id: 1,
          name: "Community Question",
          description: "Engage your community with questions",
          template_content: "💭 **Question for the community:**\n\n[YOUR QUESTION HERE]\n\nWe'd love to hear your thoughts! Share your experience in the comments below.\n\n#Community #Discussion #YourThoughts",
          template_type: "question",
          platform_specific: {},
          usage_count: 12,
          is_favorite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContentTemplates = contentTemplates.filter(contentTemplate => {
    const matchesSearch = contentTemplate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contentTemplate.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contentTemplate.template_content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || contentTemplate.template_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return Megaphone;
      case 'promotion':
        return Gift;
      case 'update':
        return FileText;
      case 'question':
        return HelpCircle;
      default:
        return MessageCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'promotion':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'update':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'question':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleCreateContentTemplate = async () => {
    if (!newContentTemplate.name.trim() || !newContentTemplate.template_content.trim()) {
      toast.error("Name and content are required");
      return;
    }

    try {
      const contentTemplate = await contentTemplatesApi.create(newContentTemplate);
      setContentTemplates(prev => [contentTemplate, ...prev]);
      setNewContentTemplate({
        name: "",
        description: "",
        template_content: "",
        template_type: "general"
      });
      setShowCreateDialog(false);
      toast.success("Content template created successfully!");
    } catch (error) {
      console.error('Failed to create content template:', error);
      toast.error("Failed to create content template");
    }
  };

  const handleUseContentTemplate = (contentTemplate: ContentTemplate) => {
    if (onUseTemplate) {
      onUseTemplate(contentTemplate);
      toast.success(`Applied content template: ${contentTemplate.name}`);
    } else {
      navigator.clipboard.writeText(contentTemplate.template_content);
      toast.success("Content template copied to clipboard!");
    }
  };

  const handleToggleFavorite = async (contentTemplateId: number, isFavorite: boolean) => {
    try {
      await contentTemplatesApi.update(contentTemplateId, { is_favorite: !isFavorite });
      setContentTemplates(prev => prev.map(t => 
        t.id === contentTemplateId ? { ...t, is_favorite: !isFavorite } : t
      ));
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Failed to update content template:', error);
      toast.error("Failed to update content template");
    }
  };

  const handleDeleteContentTemplate = async (contentTemplateId: number) => {
    try {
      await contentTemplatesApi.delete(contentTemplateId);
      setContentTemplates(prev => prev.filter(t => t.id !== contentTemplateId));
      toast.success("Content template deleted successfully");
    } catch (error) {
      console.error('Failed to delete content template:', error);
      toast.error("Failed to delete content template");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Template Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
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
            <FileText className="h-5 w-5" />
            Content Template Library
            <Badge variant="secondary">
              {contentTemplates.length} content templates
            </Badge>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Content Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-template-name">Content Template Name</Label>
                    <Input
                      id="content-template-name"
                      placeholder="e.g., Weekly Update"
                      value={newContentTemplate.name}
                      onChange={(e) => setNewContentTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content-template-type">Type</Label>
                    <Select
                      value={newContentTemplate.template_type}
                      onValueChange={(value: TemplateType) => 
                        setNewContentTemplate(prev => ({ ...prev, template_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-template-description">Description (Optional)</Label>
                  <Input
                    id="content-template-description"
                    placeholder="Brief description of when to use this content template"
                    value={newContentTemplate.description}
                    onChange={(e) => setNewContentTemplate(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-template-content">Content Template</Label>
                  <Textarea
                    id="content-template-content"
                    placeholder="Enter your content template with placeholders like [TITLE], [DATE], etc."
                    value={newContentTemplate.template_content}
                    onChange={(e) => setNewContentTemplate(prev => ({ ...prev, template_content: e.target.value }))}
                    className="min-h-[200px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateContentTemplate}>
                    Create Content Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="question">Question</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Templates Grid */}
        {filteredContentTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">
              {searchTerm ? 'No content templates match your search' : 'No content templates yet'}
            </p>
            <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Content Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContentTemplates.map((contentTemplate) => {
              const TypeIcon = getTypeIcon(contentTemplate.template_type);
              return (
                <Card key={contentTemplate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{contentTemplate.name}</h3>
                        {contentTemplate.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(contentTemplate.id, contentTemplate.is_favorite)}
                        >
                          <Star className={`h-4 w-4 ${contentTemplate.is_favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContentTemplate(contentTemplate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {contentTemplate.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {contentTemplate.description}
                      </p>
                    )}
                    
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <p className="text-sm line-clamp-3 font-mono">
                        {contentTemplate.template_content}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(contentTemplate.template_type)}>
                          {contentTemplate.template_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Used {contentTemplate.usage_count} times
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(contentTemplate.template_content);
                            toast.success("Content template copied to clipboard!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseContentTemplate(contentTemplate)}
                        >
                          Use Content Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
