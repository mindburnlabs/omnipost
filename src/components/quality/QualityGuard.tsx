
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Link,
  Image,
  Hash,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { RepostGuardChip } from "./RepostGuardChip";

interface QualityCheck {
  type: 'duplicate_content' | 'broken_links' | 'image_quality' | 'spam_detection' | 'platform_compliance' | 'mentions';
  status: 'passed' | 'warning' | 'failed';
  title: string;
  message: string;
  details?: any;
  fixable: boolean;
}

interface QualityGuardProps {
  content: string;
  title?: string;
  selectedPlatforms: number[];
  onContentChange?: (content: string) => void;
}

export function QualityGuard({ 
  content, 
  title, 
  selectedPlatforms,
  onContentChange 
}: QualityGuardProps) {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);

  const getPlatformType = useCallback((platformId: number): string => {
    // Map platform IDs to types (simplified)
    switch (platformId) {
      case 1: return 'discord';
      case 2: return 'telegram';
      case 3: return 'whop';
      default: return 'unknown';
    }
  }, []);

  const checkPlatformCompliance = useCallback((content: string, title: string = '', platforms: number[] = []): QualityCheck => {
    const issues = [];
    const totalLength = title.length + content.length;

    // Real platform limits
    for (const platformId of platforms) {
      const platformType = getPlatformType(platformId);
      
      switch (platformType) {
        case 'discord':
          if (totalLength > 2000) {
            issues.push('Discord: Content exceeds 2000 character limit');
          }
          break;
        case 'telegram':
          if (totalLength > 4096) {
            issues.push('Telegram: Content exceeds 4096 character limit');
          }
          break;
        case 'whop':
          if (totalLength > 10000) {
            issues.push('Whop: Content exceeds 10000 character limit');
          }
          break;
      }
    }

    return {
      type: 'platform_compliance',
      status: issues.length > 0 ? 'failed' : 'passed',
      title: 'Platform Compliance',
      message: issues.length > 0 
        ? `${issues.length} platform limit(s) exceeded`
        : 'Content complies with all platform requirements',
      details: { issues },
      fixable: issues.length > 0
    };
  }, [getPlatformType]);

  const checkForSpam = useCallback((content: string, title: string = ''): QualityCheck => {
    const spamIndicators = [
      /\b(buy now|limited time|act fast|urgent|free money)\b/gi,
      /[!]{3,}/g, // Multiple exclamation marks
      /[A-Z]{5,}/g, // All caps words
      /\b(click here|click now)\b/gi
    ];

    const fullText = `${title} ${content}`;
    const spamMatches = spamIndicators.reduce((count, regex) => {
      return count + (fullText.match(regex) || []).length;
    }, 0);

    const spamScore = Math.min(spamMatches * 20, 100);

    return {
      type: 'spam_detection',
      status: spamScore > 60 ? 'failed' : spamScore > 30 ? 'warning' : 'passed',
      title: 'Spam Detection',
      message: spamScore > 60 
        ? 'Content may be flagged as spam'
        : spamScore > 30 
        ? 'Some spam-like patterns detected'
        : 'Content looks natural',
      details: { spamScore, indicators: spamMatches },
      fixable: spamScore > 30
    };
  }, []);

  const performQualityChecks = useCallback(async (
    content: string, 
    title: string = '', 
    platforms: number[] = []
  ): Promise<QualityCheck[]> => {
    const checks: QualityCheck[] = [];

    try {
      // Real link validation
      if (content.includes('http')) {
        const linkValidation = await api.post('/content-validation/links', { content });
        
        checks.push({
          type: 'broken_links',
          status: linkValidation.summary.invalidLinks > 0 ? 'failed' : 
                  linkValidation.summary.warningLinks > 0 ? 'warning' : 'passed',
          title: 'Link Validation',
          message: linkValidation.recommendation,
          details: linkValidation,
          fixable: linkValidation.summary.invalidLinks > 0
        });
      }

      // Real mention resolution for selected platforms
      if (platforms.length > 0 && (content.includes('@') || content.includes('<@'))) {
        // Check mentions for each selected platform
        for (const platformId of platforms) {
          try {
            const mentionValidation = await api.post('/content-validation/mentions', {
              content,
              platform_type: getPlatformType(platformId),
              connection_id: platformId
            });

            checks.push({
              type: 'mentions',
              status: mentionValidation.summary.unresolvedMentions > 0 ? 'warning' : 'passed',
              title: `Mentions (${getPlatformType(platformId)})`,
              message: mentionValidation.recommendation,
              details: mentionValidation,
              fixable: false
            });
          } catch (error) {
            console.warn('Mention validation failed for platform', platformId, error);
          }
        }
      }

      // Platform compliance check
      const complianceCheck = checkPlatformCompliance(content, title, platforms);
      checks.push(complianceCheck);

      // Spam detection
      const spamCheck = checkForSpam(content, title);
      checks.push(spamCheck);

    } catch (error) {
      console.error('Quality checks failed:', error);
    }

    return checks.filter(check => check !== null);
  }, [getPlatformType, checkPlatformCompliance, checkForSpam]);

  const runQualityChecks = useCallback(async () => {
    setLoading(true);
    try {
      const checks = await performQualityChecks(content, title || '', selectedPlatforms);
      setChecks(checks);
    } catch (error) {
      console.error('Quality checks failed:', error);
    } finally {
      setLoading(false);
    }
  }, [content, title, selectedPlatforms, performQualityChecks]);

  useEffect(() => {
    if (content.trim()) {
      runQualityChecks();
    }
  }, [content, title, selectedPlatforms, runQualityChecks]);

  const handleAutoFix = async () => {
    setAutoFixing(true);
    try {
      // Get AI suggestions for fixing issues
      const fixableIssues = checks.filter(check => check.fixable && check.status !== 'passed');
      
      if (fixableIssues.length === 0) {
        toast.info("No fixable issues found");
        return;
      }

      const fixInstructions = fixableIssues.map(issue => {
        switch (issue.type) {
          case 'broken_links':
            return 'Fix or remove broken links';
          case 'spam_detection':
            return 'Remove spam-like language and excessive punctuation';
          case 'platform_compliance':
            return 'Shorten content to meet platform character limits';
          default:
            return `Fix ${issue.type.replace('_', ' ')} issues`;
        }
      }).join(', ');

      const response = await api.post('/ai/improve', {
        content,
        instructions: `Fix these issues: ${fixInstructions}`
      });

      if (onContentChange) {
        onContentChange(response.improvedContent);
        toast.success("Content auto-fixed successfully!");
        
        // Re-run quality checks
        setTimeout(() => {
          runQualityChecks();
        }, 1000);
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
      toast.error("Auto-fix failed. Please make manual corrections.");
    } finally {
      setAutoFixing(false);
    }
  };

  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getCheckColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'broken_links':
        return Link;
      case 'image_quality':
        return Image;
      case 'spam_detection':
        return Shield;
      case 'platform_compliance':
        return CheckCircle;
      case 'mentions':
        return Hash;
      default:
        return Shield;
    }
  };

  const hasIssues = checks.some(check => check.status === 'failed' || check.status === 'warning');
  const hasFixableIssues = checks.some(check => check.fixable && check.status !== 'passed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quality Guard
            {!loading && (
              <Badge variant={hasIssues ? "destructive" : "default"}>
                {hasIssues ? 'Issues Found' : 'All Clear'}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {hasFixableIssues && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFix}
                disabled={autoFixing}
              >
                {autoFixing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-1" />
                    Auto-Fix
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={runQualityChecks}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repost Guard - Always show for substantial content */}
        {content.trim().length > 20 && (
          <RepostGuardChip
            content={content}
            title={title}
            onContentChange={onContentChange}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        ) : checks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter content to run quality checks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checks.map((check, index) => {
              const TypeIcon = getTypeIcon(check.type);
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{check.title}</span>
                      <Badge className={getCheckColor(check.status)}>
                        <div className="flex items-center gap-1">
                          {getCheckIcon(check.status)}
                          <span className="text-xs">{check.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {check.message}
                    </p>
                    {check.details && check.status !== 'passed' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {check.type === 'broken_links' && check.details.summary && (
                          <span>
                            {check.details.summary.invalidLinks > 0 && `${check.details.summary.invalidLinks} broken, `}
                            {check.details.summary.warningLinks > 0 && `${check.details.summary.warningLinks} warnings, `}
                            {check.details.summary.timeoutLinks > 0 && `${check.details.summary.timeoutLinks} timeouts`}
                          </span>
                        )}
                        {check.type === 'spam_detection' && check.details.spamScore && (
                          <span>Spam score: {check.details.spamScore}%</span>
                        )}
                        {check.type === 'mentions' && check.details.summary && (
                          <span>
                            {check.details.summary.unresolvedMentions} unresolved mentions, 
                            {check.details.summary.invalidRoles} invalid roles
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {hasIssues && (
              <Alert variant={checks.some(c => c.status === 'failed') ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {checks.filter(c => c.status === 'failed').length > 0 
                    ? 'Critical issues found. Please fix before publishing.'
                    : 'Some warnings detected. Review before publishing.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
