
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bold, 
  Italic, 
  Link, 
  Image, 
  Hash, 
  AtSign,
  Type,
  FileText,
  Sparkles,
  Target
} from "lucide-react";
import { ContentOptimizer } from "@/components/content/ContentOptimizer";

interface ContentEditorProps {
  title: string;
  content: string;
  tags: string[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export function ContentEditor({
  title,
  content,
  tags,
  onTitleChange,
  onContentChange,
  onTagsChange
}: ContentEditorProps) {
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("editor");

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const insertFormatting = (format: string) => {
    // This would integrate with a rich text editor in a real implementation
    console.log('Insert formatting:', format);
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Content Editor
          <Badge variant="outline" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Enhanced
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="editor">
              <FileText className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="optimizer">
              <Target className="h-4 w-4 mr-2" />
              Optimizer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (Optional)</label>
              <Input
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-2 border rounded-lg bg-muted/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('bold')}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('italic')}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('link')}
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('image')}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('hashtag')}
              >
                <Hash className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertFormatting('mention')}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="What would you like to share? (AI can help improve your content)"
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{content.length} characters</span>
                <span>
                  {content.length > 280 && "⚠️ Long for Twitter-like platforms"}
                </span>
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content Type Detection */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Type className="h-4 w-4" />
              <span>Content type: </span>
              <Badge variant="outline">
                {content.includes('http') ? 'Link' : 'Text'}
              </Badge>
              {content.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Ready
                </Badge>
              )}
            </div>
          </TabsContent>

          <TabsContent value="optimizer">
            <ContentOptimizer
              content={content}
              title={title}
              onContentChange={onContentChange}
              onTitleChange={onTitleChange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
