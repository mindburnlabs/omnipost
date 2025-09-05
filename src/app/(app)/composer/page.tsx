
"use client";

import { useState, useEffect } from "react";
import { PlatformSelector } from "@/components/composer/PlatformSelector";
import { ContentEditor } from "@/components/composer/ContentEditor";
import { PlatformPreview } from "@/components/composer/PlatformPreview";
import { ValidationChips } from "@/components/composer/ValidationChips";
import { SchedulingPanel } from "@/components/composer/SchedulingPanel";
import { AIAssistant } from "@/components/composer/AIAssistant";
import { PublishingTest } from "@/components/composer/PublishingTest";
import { platformConnectionsApi, postsApi } from "@/lib/omnipost-api";
import { PlatformConnection } from "@/types/omnipost";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ComposerPage() {
  const router = useRouter();
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await platformConnectionsApi.getAll();
        setConnections(data.filter(conn => conn.connection_status === 'active'));
      } catch (error) {
        console.error('Failed to fetch connections:', error);
        // Mock data for demo
        setConnections([
          {
            id: 1,
            user_id: 1,
            platform_type: 'discord',
            connection_name: 'Main Discord Server',
            api_credentials: {},
            connection_status: 'active',
            last_sync_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            user_id: 1,
            platform_type: 'telegram',
            connection_name: 'Telegram Channel',
            api_credentials: {},
            connection_status: 'active',
            last_sync_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 3,
            user_id: 1,
            platform_type: 'whop',
            connection_name: 'Whop Community',
            api_credentials: {},
            connection_status: 'active',
            last_sync_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    };

    fetchConnections();
  }, []);

  const isValid = content.trim().length > 0 && selectedPlatforms.length > 0;

  const createDraftPost = async () => {
    if (!content.trim()) return null;

    try {
      const postData = {
        content,
        content_type: content.includes('http') ? 'link' as const : 'text' as const,
        status: 'draft' as const,
        tags,
        metadata: {
          platforms: selectedPlatforms
        }
      } as const;

      // Only add title if it's not empty
      const finalPostData = title.trim() 
        ? { ...postData, title: title.trim() }
        : postData;

      const post = await postsApi.create(finalPostData);
      
      setCurrentPostId(post.id);
      return post;
    } catch (error) {
      console.error('Failed to create draft:', error);
      return null;
    }
  };

  const handlePublishNow = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      let postId = currentPostId;
      
      if (!postId) {
        const post = await createDraftPost();
        if (!post) {
          throw new Error('Failed to create post');
        }
        postId = post.id;
      }

      // Publish immediately
      await postsApi.publish(postId);
      toast.success('Post published successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to publish post:', error);
      toast.error('Failed to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (scheduledAt: Date) => {
    if (!isValid) return;

    setLoading(true);
    try {
      let postId = currentPostId;
      
      if (!postId) {
        const post = await createDraftPost();
        if (!post) {
          throw new Error('Failed to create post');
        }
        postId = post.id;
      }

      // Schedule the post
      await postsApi.schedule(postId, scheduledAt.toISOString());
      toast.success('Post scheduled successfully!');
      router.push('/calendar');
    } catch (error) {
      console.error('Failed to schedule post:', error);
      toast.error('Failed to schedule post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      if (currentPostId) {
        // Update existing draft
        const updateData = {
          content,
          tags,
          metadata: {
            platforms: selectedPlatforms
          }
        } as const;

        // Only add title if it's not empty
        const finalUpdateData = title.trim() 
          ? { ...updateData, title: title.trim() }
          : updateData;

        await postsApi.update(currentPostId, finalUpdateData);
      } else {
        // Create new draft
        await createDraftPost();
      }

      toast.success('Draft saved successfully!');
      router.push('/library');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    toast.info('Preview functionality would open a modal or new tab');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Composer</h1>
        <p className="text-muted-foreground">
          Create and schedule content across multiple platforms with AI assistance
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Platform Selection & Validation */}
        <div className="lg:col-span-1 space-y-6">
          <PlatformSelector
            selectedPlatforms={selectedPlatforms}
            onPlatformChange={setSelectedPlatforms}
          />
          <ValidationChips
            content={content}
            title={title}
            selectedPlatforms={selectedPlatforms}
            onContentChange={setContent}
          />
          
          {/* Publishing Test */}
          {currentPostId && selectedPlatforms.length > 0 && (
            <PublishingTest
              postId={currentPostId}
              postTitle={title || 'Untitled Post'}
              selectedPlatforms={selectedPlatforms}
            />
          )}
          
          <SchedulingPanel
            onSchedule={handleSchedule}
            onPublishNow={handlePublishNow}
            onSaveDraft={handleSaveDraft}
            onPreview={handlePreview}
            isValid={isValid}
            loading={loading}
            selectedPlatforms={selectedPlatforms}
            userTimezone="UTC"
          />
        </div>

        {/* Center Panel - Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <ContentEditor
            title={title}
            content={content}
            tags={tags}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onTagsChange={setTags}
          />
          
          {/* AI Assistant */}
          <AIAssistant
            content={content}
            onContentChange={setContent}
            onTagsAdd={(newTags) => {
              const uniqueTags = newTags.filter(tag => !tags.includes(tag));
              if (uniqueTags.length > 0) {
                setTags([...tags, ...uniqueTags]);
              }
            }}
            selectedPlatforms={selectedPlatforms}
            connections={connections}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-1">
          <PlatformPreview
            selectedPlatforms={selectedPlatforms}
            title={title}
            content={content}
            tags={tags}
            connections={connections}
          />
        </div>
      </div>
    </div>
  );
}
