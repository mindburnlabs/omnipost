
"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Eye,
  Clock
} from "lucide-react";
import { api } from "@/lib/api-client";
import { format, parseISO } from "date-fns";

interface DuplicateMatch {
  postId: number;
  title?: string;
  content: string;
  similarity: number;
  publishedAt?: string;
  platforms: string[];
}

interface RepostGuardResult {
  status: 'OK' | 'WARN' | 'BLOCK';
  similarity: number;
  matches: DuplicateMatch[];
  recommendation: string;
  canProceed: boolean;
}

interface RepostGuardChipProps {
  content: string;
  title?: string;
  excludePostId?: number;
  onContentChange?: (content: string) => void;
}

export function RepostGuardChip({ 
  content, 
  title, 
  excludePostId,
  onContentChange 
}: RepostGuardChipProps) {
  const [result, setResult] = useState<RepostGuardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkForDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/repost-guard/check', {
        content,
        title,
        exclude_post_id: excludePostId
      });
      
      setResult(response);
    } catch (error) {
      console.error('Repost guard check failed:', error);
      setResult({
        status: 'OK',
        similarity: 0,
        matches: [],
        recommendation: 'Unable to check for duplicates',
        canProceed: true
      });
    } finally {
      setLoading(false);
    }
  }, [content, title, excludePostId]);

  useEffect(() => {
    if (content.trim().length > 20) { // Only check substantial content
      checkForDuplicates();
    } else {
      setResult(null);
    }
  }, [content, title, checkForDuplicates]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'WARN':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'BLOCK':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Shield className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'BLOCK':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleRewrite = async () => {
    if (!onContentChange) return;

    try {
      const response = await api.post('/ai/improve', {
        content,
        instructions: 'Rewrite this content to be more unique while keeping the core message. Make it significantly different from the original.'
      });

      onContentChange(response.improvedContent);
    } catch (error) {
      console.error('Failed to rewrite content:', error);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span className="text-xs">Checking duplicates...</span>
      </Badge>
    );
  }

  if (!result) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Shield className="h-3 w-3 text-gray-400" />
        <span className="text-xs">Repost Guard</span>
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(result.status)}>
          <div className="flex items-center gap-1">
            {getStatusIcon(result.status)}
            <span className="text-xs">
              {result.status === 'OK' ? 'Unique' : 
               result.status === 'WARN' ? `${result.similarity}% similar` :
               'Duplicate detected'}
            </span>
          </div>
        </Badge>
        
        {result.matches.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="h-3 w-3 mr-1" />
            {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
          </Button>
        )}
      </div>

      {showDetails && result.matches.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Similar Content Found</h4>
                {result.status === 'BLOCK' && onContentChange && (
                  <Button size="sm" onClick={handleRewrite}>
                    AI Rewrite
                  </Button>
                )}
              </div>
              
              <Alert variant={result.status === 'BLOCK' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {result.recommendation}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {result.matches.slice(0, 3).map((match, index) => (
                  <div key={index} className="p-2 border rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {match.title || `Post #${match.postId}`}
                      </span>
                      <Badge variant="outline">
                        {match.similarity}% similar
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                      {match.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {match.publishedAt && (
                        <span className="text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(parseISO(match.publishedAt), 'MMM dd, yyyy')}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {match.platforms.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
