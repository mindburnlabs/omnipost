
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Play,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface PublishTestResult {
  post_id: number;
  post_title: string;
  platforms_tested: number;
  all_connections_working: boolean;
  ready_to_publish: boolean;
  test_results: Array<{
    connection_id: number;
    platform_type: string;
    connection_name: string;
    success: boolean;
    message: string;
  }>;
  issues?: Array<{
    connection_id: number;
    error: string;
  }>;
}

interface PublishingTestProps {
  postId: number;
  postTitle: string;
  selectedPlatforms: number[];
  onTestComplete?: (result: PublishTestResult) => void;
}

export function PublishingTest({ 
  postId, 
  postTitle, 
  selectedPlatforms,
  onTestComplete 
}: PublishingTestProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<PublishTestResult | null>(null);
  const [lastTestTime, setLastTestTime] = useState<string>("");

  const runPublishTest = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform to test");
      return;
    }

    setTesting(true);
    try {
      const result = await api.post(`/posts/${postId}/test-publish`);
      setTestResult(result);
      setLastTestTime(new Date().toLocaleTimeString());
      onTestComplete?.(result);
      
      if (result.all_connections_working) {
        toast.success("All platform connections are working!");
      } else {
        toast.warning("Some platform connections have issues");
      }
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to test publishing");
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getResultColor = (success: boolean) => {
    return success 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'discord':
        return '🎮';
      case 'telegram':
        return '✈️';
      case 'whop':
        return '🛍️';
      default:
        return '📱';
    }
  };

  const getConnectionIcon = (success: boolean) => {
    return success ? (
      <Wifi className="h-4 w-4 text-green-600" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Publishing Test
          {lastTestTime && (
            <Badge variant="outline" className="ml-auto text-xs">
              Last: {lastTestTime}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{postTitle}</p>
            <p className="text-sm text-muted-foreground">
              Test connections before publishing
            </p>
          </div>
          <div className="flex gap-2">
            {testResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={runPublishTest}
                disabled={testing}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={runPublishTest}
              disabled={testing || selectedPlatforms.length === 0}
              variant="outline"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {testing ? 'Testing...' : 'Test Publish'}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="space-y-4">
            {/* Overall Result */}
            <Alert variant={testResult.ready_to_publish ? "default" : "destructive"}>
              {testResult.ready_to_publish ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {testResult.ready_to_publish 
                  ? `All ${testResult.platforms_tested} platform connections are working correctly`
                  : `${testResult.issues?.length || 0} platform connection(s) have issues`
                }
              </AlertDescription>
            </Alert>

            {/* Platform Results */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Platform Test Results</h4>
              {testResult.test_results.map((result) => (
                <div key={result.connection_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getPlatformIcon(result.platform_type)}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{result.connection_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {result.platform_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getConnectionIcon(result.success)}
                    <Badge className={getResultColor(result.success)}>
                      {result.success ? 'Working' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Issues */}
            {testResult.issues && testResult.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-600">Issues Found</h4>
                {testResult.issues.map((issue, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      Connection {issue.connection_id}: {issue.error}
                    </p>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild>
                  <a href="/settings?tab=connections">
                    Fix Connection Issues
                  </a>
                </Button>
              </div>
            )}

            {/* Success Actions */}
            {testResult.ready_to_publish && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  ✅ Ready to publish! All connections tested successfully.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
