
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Wand2, 
  Hash, 
  Lightbulb, 
  ImageIcon, 
  TestTube,
  Loader2,
  Copy,
  Check,
  Settings,
  AlertCircle,
  Target,
  Brain,
  Zap,
  Clock,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";

interface AIAssistantProps {
  content: string;
  onContentChange: (content: string) => void;
  onTagsAdd: (tags: string[]) => void;
  selectedPlatforms: number[];
  connections: Array<{
    id: number;
    platform_type: string;
    connection_name: string;
  }>;
}

interface AvailableAlias {
  name: string;
  display_name: string;
  modality: string;
  capability: string;
  provider: string;
  status: string;
  budget_status: string;
}

export function AIAssistant({ 
  content, 
  onContentChange, 
  onTagsAdd, 
  selectedPlatforms,
  connections 
}: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("improve");
  const [customPrompt, setCustomPrompt] = useState("");
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [availableAliases, setAvailableAliases] = useState<AvailableAlias[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<string>('default-writer');
  const [routingInfo, setRoutingInfo] = useState<any>(null);

  const selectedConnections = connections.filter(conn => 
    selectedPlatforms.includes(conn.id)
  );

  useEffect(() => {
    fetchAvailableAliases();
  }, []);

  const fetchAvailableAliases = async () => {
    try {
      // This would be implemented in the AI service
      const sampleAliases: AvailableAlias[] = [
        {
          name: 'default-writer',
          display_name: 'Default Writer',
          modality: 'text',
          capability: 'chat',
          provider: 'openai',
          status: 'active',
          budget_status: 'ok'
        },
        {
          name: 'fast-drafts',
          display_name: 'Fast Drafts',
          modality: 'text',
          capability: 'completion',
          provider: 'groq',
          status: 'missing_key',
          budget_status: 'no_budget'
        },
        {
          name: 'image-hero',
          display_name: 'Image Generator',
          modality: 'image',
          capability: 'generate',
          provider: 'openai',
          status: 'active',
          budget_status: 'warning'
        }
      ];
      setAvailableAliases(sampleAliases);
    } catch (error) {
      console.error('Failed to fetch available aliases:', error);
    }
  };

  const handleImproveContent = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    const alias = availableAliases.find(a => a.name === selectedAlias);
    if (!alias || alias.status !== 'active') {
      toast.error("Selected alias is not available. Please choose another or configure AI keys.");
      return;
    }

    setLoading(true);
    try {
      // Use new AI invoke endpoint with alias routing
      const response = await api.post('/ai-invoke', {
        alias_name: selectedAlias,
        capability: 'chat',
        prompt: customPrompt ? 
          `Improve this content based on these instructions: "${customPrompt}". Original content: "${content}"` :
          `Improve this social media content to make it more engaging, clear, and effective. Keep the core message but enhance the presentation: "${content}"`,
        options: {
          temperature: 0.7,
          max_tokens: 1000
        },
        workspace_id: 1
      });

      setGeneratedContent(response.content);
      setRoutingInfo(response.routing_info);
      
      // Show routing info if fallback was used
      if (response.routing_info?.fallback_used) {
        toast.info(`Rerouted to ${response.provider_used} (${response.routing_info.fallback_reason})`);
      } else {
        toast.success("Content improved successfully!");
      }
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to improve content");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeForPlatform = async (platform: string) => {
    if (!content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    const alias = availableAliases.find(a => a.name === selectedAlias);
    if (!alias || alias.status !== 'active') {
      toast.error("Selected alias is not available. Please configure AI keys.");
      return;
    }

    setLoading(true);
    try {
      const platformPrompts = {
        discord: `Optimize this content for Discord. Keep it engaging, use appropriate Discord formatting (bold **text**, italic *text*), and ensure it fits Discord's community vibe. Content: "${content}"`,
        telegram: `Optimize this content for Telegram. Make it clear, concise, and engaging. Use Telegram markdown formatting where appropriate. Content: "${content}"`,
        whop: `Optimize this content for a Whop community. Make it professional yet engaging, suitable for a creator economy platform. Content: "${content}"`
      };

      const response = await api.post('/ai-invoke', {
        alias_name: selectedAlias,
        capability: 'chat',
        prompt: platformPrompts[platform as keyof typeof platformPrompts],
        options: { temperature: 0.7 },
        workspace_id: 1
      });

      setGeneratedContent(response.content);
      setRoutingInfo(response.routing_info);
      toast.success(`Content optimized for ${platform}!`);
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to optimize content");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai-invoke', {
        alias_name: 'fast-drafts', // Use fast alias for hashtags
        capability: 'completion',
        prompt: `Generate 8 relevant hashtags for this social media content. Return only the hashtags without the # symbol, one per line: "${content}"`,
        options: { temperature: 0.5 },
        workspace_id: 1
      });

      const hashtags = response.content
        .split('\n')
        .map((tag: string) => tag.trim().replace('#', ''))
        .filter((tag: string) => tag.length > 0)
        .slice(0, 8);

      onTagsAdd(hashtags);
      setRoutingInfo(response.routing_info);
      toast.success(`Generated ${hashtags.length} hashtags!`);
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to generate hashtags");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic first");
      return;
    }

    setLoading(true);
    try {
      const platform = selectedConnections[0]?.platform_type;
      const response = await api.post('/ai-invoke', {
        alias_name: 'fast-drafts',
        capability: 'completion',
        prompt: `Generate 5 creative content ideas about "${topic}"${platform ? ` for ${platform}` : ''}. Make them engaging and actionable. Return one idea per line.`,
        options: { temperature: 0.8 },
        workspace_id: 1
      });

      setGeneratedContent(response.content);
      setRoutingInfo(response.routing_info);
      toast.success("Content ideas generated!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to generate ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVariants = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai-invoke', {
        alias_name: selectedAlias,
        capability: 'chat',
        prompt: `Create 3 different variations of this social media content for A/B testing. Each variant should have a different approach (tone, structure, call-to-action, etc.) but convey the same core message. Return each variant separated by "---". Original content: "${content}"`,
        options: { temperature: 0.8 },
        workspace_id: 1
      });

      setGeneratedContent(response.content);
      setRoutingInfo(response.routing_info);
      toast.success("A/B test variants generated!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to generate variants");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai-invoke', {
        alias_name: selectedAlias,
        capability: 'chat',
        prompt: customPrompt,
        options: { temperature: 0.7 },
        workspace_id: 1
      });

      setGeneratedContent(response.content);
      setRoutingInfo(response.routing_info);
      toast.success("Content generated successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeImage = async (imageFile: File) => {
    setLoading(true);
    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/... prefix
        };
        reader.readAsDataURL(imageFile);
      });

      const response = await api.post('/ai-invoke', {
        alias_name: 'image-hero',
        capability: 'generate',
        prompt: "Analyze this image and suggest how it could be used for social media content. What message would work well with this image?",
        input_data: { image: base64 },
        workspace_id: 1
      });

      setGeneratedContent(response.content);
      setRoutingInfo(response.routing_info);
      toast.success("Image analyzed successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleUseGenerated = () => {
    if (generatedContent) {
      onContentChange(generatedContent);
      setGeneratedContent("");
      setRoutingInfo(null);
      toast.success("Content applied!");
    }
  };

  const handleCopyGenerated = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Content copied to clipboard!");
    }
  };

  const getAliasStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'missing_key':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'exceeded':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Assistant
          <div className="ml-auto flex items-center gap-2">
            {/* Alias Selector */}
            <Select value={selectedAlias} onValueChange={setSelectedAlias}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableAliases.map((alias) => (
                  <SelectItem key={alias.name} value={alias.name}>
                    <div className="flex items-center gap-2">
                      <span>{alias.display_name}</span>
                      {getAliasStatusIcon(alias.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings?tab=ai">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Alias Status Alert */}
        {(() => {
          const currentAlias = availableAliases.find(a => a.name === selectedAlias);
          if (currentAlias?.status !== 'active') {
            return (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {currentAlias?.status === 'missing_key' 
                    ? `No API key configured for ${currentAlias.provider}. Add a key for this alias in Settings → AI Keys.`
                    : `Alias "${selectedAlias}" is not available. Please check your configuration.`
                  }
                  <Button variant="link" className="p-0 h-auto ml-2" asChild>
                    <Link href="/settings?tab=ai&subtab=keys">
                      Configure AI Keys
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            );
          }
          
          if (currentAlias?.budget_status === 'exceeded') {
            return (
              <Alert variant="destructive" className="mb-4">
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Budget reached for {currentAlias.provider}. Increase cap or switch to platform credits.
                </AlertDescription>
              </Alert>
            );
          }
          
          if (currentAlias?.budget_status === 'warning') {
            return (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Budget warning: {currentAlias.provider} usage is above 80%. Monitor your spending.
                </AlertDescription>
              </Alert>
            );
          }
          
          return null;
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="improve">
              <Wand2 className="h-4 w-4 mr-1" />
              Improve
            </TabsTrigger>
            <TabsTrigger value="optimize">
              <Target className="h-4 w-4 mr-1" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="hashtags">
              <Hash className="h-4 w-4 mr-1" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="ideas">
              <Lightbulb className="h-4 w-4 mr-1" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="variants">
              <TestTube className="h-4 w-4 mr-1" />
              A/B Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="improve" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Instructions (Optional)</label>
              <Textarea
                placeholder="e.g., Make it more professional, add a call-to-action, make it shorter..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <Button 
              onClick={handleImproveContent} 
              disabled={loading || availableAliases.find(a => a.name === selectedAlias)?.status !== 'active'}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
              Improve Content
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Prompt</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter any AI prompt..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <Button onClick={handleCustomGenerate} disabled={loading}>
                  Generate
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Optimize your content for specific platforms using AI
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedConnections.map((connection) => (
                <Button
                  key={connection.id}
                  variant="outline"
                  onClick={() => handleOptimizeForPlatform(connection.platform_type)}
                  disabled={loading || availableAliases.find(a => a.name === selectedAlias)?.status !== 'active'}
                >
                  Optimize for {connection.platform_type}
                </Button>
              ))}
              {selectedConnections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Select platforms to see optimization options
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate relevant hashtags based on your content
            </p>
            <Button 
              onClick={handleGenerateHashtags} 
              disabled={loading || !content.trim() || availableAliases.find(a => a.name === 'fast-drafts')?.status !== 'active'}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Hash className="h-4 w-4 mr-2" />}
              Generate Hashtags
            </Button>
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input
                placeholder="e.g., productivity tips, tech news, marketing strategies..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleGenerateIdeas} 
              disabled={loading || !topic.trim() || availableAliases.find(a => a.name === 'fast-drafts')?.status !== 'active'}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Generate Ideas
            </Button>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create different versions of your content for A/B testing
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateVariants} 
                disabled={loading || !content.trim() || availableAliases.find(a => a.name === selectedAlias)?.status !== 'active'}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                Generate Variants
              </Button>
              
              {/* Image Analysis */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAnalyzeImage(file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading || availableAliases.find(a => a.name === 'image-hero')?.status !== 'active'}
                  aria-label="Upload image for analysis"
                />
                <Button 
                  variant="outline" 
                  disabled={loading || availableAliases.find(a => a.name === 'image-hero')?.status !== 'active'}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Analyze Image
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated Content Display */}
        {generatedContent && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Generated Content
                {routingInfo && (
                  <Badge variant="outline" className="text-xs">
                    via {routingInfo.provider_of_record}
                  </Badge>
                )}
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyGenerated}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" onClick={handleUseGenerated}>
                  Use This
                </Button>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
            </div>
            
            {/* Routing Information */}
            {routingInfo && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-4 text-xs text-blue-900 dark:text-blue-100">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Alias: {routingInfo.alias_used}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{routingInfo.latency_ms}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${routingInfo.cost_estimate.toFixed(4)}</span>
                  </div>
                  {routingInfo.fallback_used && (
                    <Badge variant="outline" className="text-xs">
                      Fallback: {routingInfo.fallback_reason}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Alias Info */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Using alias: {selectedAlias}</span>
              {(() => {
                const alias = availableAliases.find(a => a.name === selectedAlias);
                return alias && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      {alias.provider}
                    </Badge>
                    <span className={getBudgetStatusColor(alias.budget_status)}>
                      {alias.budget_status.replace('_', ' ')}
                    </span>
                  </>
                );
              })()}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings?tab=ai&subtab=aliases">
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
