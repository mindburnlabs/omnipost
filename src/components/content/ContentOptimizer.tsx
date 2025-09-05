
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  Hash, 
  Clock,
  MessageSquare,
  Image,
  Link,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface OptimizationSuggestion {
  type: 'length' | 'hashtags' | 'timing' | 'engagement' | 'platform' | 'readability';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
  before?: string;
  after?: string;
}

interface ContentOptimizerProps {
  content: string;
  title?: string;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  selectedPlatforms?: string[];
}

export function ContentOptimizer({ 
  content, 
  title, 
  onContentChange, 
  onTitleChange,
  selectedPlatforms = []
}: ContentOptimizerProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState("");
  const [overallScore, setOverallScore] = useState(0);

  const analyzeContent = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to analyze");
      return;
    }

    setLoading(true);
    try {
      // Generate optimization suggestions
      const suggestions = generateOptimizationSuggestions(content, title, selectedPlatforms);
      setSuggestions(suggestions);
      
      // Calculate overall score
      const score = calculateContentScore(content, title, suggestions);
      setOverallScore(score);

      // Get AI-powered optimization if available
      try {
        const aiResponse = await api.post('/ai/improve', {
          content,
          instructions: "Optimize this content for better engagement and clarity"
        });
        setOptimizedContent(aiResponse.improvedContent);
      } catch (aiError) {
        console.warn('AI optimization not available:', aiError);
      }

      toast.success("Content analysis completed!");
    } catch (error) {
      console.error('Failed to analyze content:', error);
      toast.error("Failed to analyze content");
    } finally {
      setLoading(false);
    }
  };

  const generateOptimizationSuggestions = (
    content: string, 
    title?: string, 
    platforms: string[] = []
  ): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // Length optimization
    const contentLength = content.length;
    if (contentLength < 50) {
      suggestions.push({
        type: 'length',
        title: 'Content Too Short',
        description: 'Short posts often get less engagement',
        impact: 'medium',
        suggestion: 'Add more detail, context, or a call-to-action to reach 100-300 characters',
        before: `${contentLength} characters`,
        after: '100-300 characters (recommended)'
      });
    } else if (contentLength > 500) {
      suggestions.push({
        type: 'length',
        title: 'Content Too Long',
        description: 'Long posts may lose reader attention',
        impact: 'medium',
        suggestion: 'Consider breaking into multiple posts or summarizing key points',
        before: `${contentLength} characters`,
        after: '200-400 characters (recommended)'
      });
    }

    // Hashtag analysis
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    if (hashtagCount === 0) {
      suggestions.push({
        type: 'hashtags',
        title: 'No Hashtags Found',
        description: 'Hashtags can increase discoverability',
        impact: 'high',
        suggestion: 'Add 3-5 relevant hashtags to improve reach',
        before: '0 hashtags',
        after: '3-5 hashtags'
      });
    } else if (hashtagCount > 10) {
      suggestions.push({
        type: 'hashtags',
        title: 'Too Many Hashtags',
        description: 'Excessive hashtags can appear spammy',
        impact: 'medium',
        suggestion: 'Reduce to 5-8 most relevant hashtags',
        before: `${hashtagCount} hashtags`,
        after: '5-8 hashtags'
      });
    }

    // Engagement optimization
    const hasQuestion = /\?/.test(content);
    const hasCallToAction = /\b(click|visit|check|try|get|download|sign up|join|follow)\b/i.test(content);
    
    if (!hasQuestion && !hasCallToAction) {
      suggestions.push({
        type: 'engagement',
        title: 'Missing Call-to-Action',
        description: 'Posts with clear CTAs get 25% more engagement',
        impact: 'high',
        suggestion: 'Add a question or call-to-action to encourage interaction',
        before: 'No CTA detected',
        after: 'Clear call-to-action added'
      });
    }

    // Platform-specific suggestions
    if (platforms.includes('discord')) {
      if (!content.includes('**') && !content.includes('*')) {
        suggestions.push({
          type: 'platform',
          title: 'Discord Formatting',
          description: 'Discord supports rich text formatting',
          impact: 'low',
          suggestion: 'Use **bold** and *italic* formatting for better readability',
          before: 'Plain text',
          after: 'Formatted text'
        });
      }
    }

    // Readability check
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    if (avgSentenceLength > 100) {
      suggestions.push({
        type: 'readability',
        title: 'Long Sentences',
        description: 'Shorter sentences are easier to read',
        impact: 'medium',
        suggestion: 'Break long sentences into shorter, punchier ones',
        before: `${Math.round(avgSentenceLength)} chars/sentence`,
        after: '50-80 chars/sentence'
      });
    }

    return suggestions;
  };

  const calculateContentScore = (
    content: string, 
    title?: string, 
    suggestions: OptimizationSuggestion[] = []
  ): number => {
    let score = 100;

    // Deduct points for each suggestion based on impact
    suggestions.forEach(suggestion => {
      switch (suggestion.impact) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Bonus points for good practices
    if (content.length >= 100 && content.length <= 300) score += 5;
    if (title && title.length > 0) score += 5;
    if (/[!?]/.test(content)) score += 3; // Emotional punctuation
    if (/\b(you|your)\b/i.test(content)) score += 3; // Direct address

    return Math.max(0, Math.min(100, score));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'length':
        return Target;
      case 'hashtags':
        return Hash;
      case 'timing':
        return Clock;
      case 'engagement':
        return TrendingUp;
      case 'platform':
        return MessageSquare;
      case 'readability':
        return MessageSquare;
      default:
        return Lightbulb;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const applyOptimizedContent = () => {
    if (optimizedContent && onContentChange) {
      onContentChange(optimizedContent);
      toast.success("Optimized content applied!");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Content Optimizer
          {overallScore > 0 && (
            <Badge variant="outline" className={getScoreColor(overallScore)}>
              {overallScore}% optimized
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzeContent} disabled={loading || !content.trim()}>
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </Button>

        {overallScore > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Content Optimization Score</span>
              <span className={`font-medium ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
        )}

        <Tabs defaultValue="suggestions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suggestions">
              Suggestions ({suggestions.length})
            </TabsTrigger>
            {optimizedContent && (
              <TabsTrigger value="ai-optimized">
                AI Optimized
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="suggestions">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No optimization suggestions</p>
                <p className="text-sm">Your content looks great!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const IconComponent = getSuggestionIcon(suggestion.type);
                  
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{suggestion.title}</h4>
                              <Badge className={getImpactColor(suggestion.impact)}>
                                {suggestion.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm text-blue-900 dark:text-blue-100">
                                <strong>Suggestion:</strong> {suggestion.suggestion}
                              </p>
                              {suggestion.before && suggestion.after && (
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                  <span className="text-red-600">Before: {suggestion.before}</span>
                                  <span>→</span>
                                  <span className="text-green-600">After: {suggestion.after}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {optimizedContent && (
            <TabsContent value="ai-optimized">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">AI-Optimized Version</h4>
                      <Button onClick={applyOptimizedContent}>
                        Apply Changes
                      </Button>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{optimizedContent}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
