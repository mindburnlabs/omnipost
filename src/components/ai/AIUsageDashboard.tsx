
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  DollarSign, 
  Zap, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface UsageMetrics {
  timeframe: string;
  summary: {
    total_calls: number;
    total_tokens: number;
    total_cost_usd: number;
    avg_cost_per_call: number;
    avg_tokens_per_call: number;
    error_rate_percent: number;
  };
  by_provider: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
    success_rate: number;
    avg_latency: number;
  }>;
  by_alias: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
    success_rate: number;
    fallback_rate: number;
  }>;
  recent_errors: Array<{
    provider: string;
    error: string;
    timestamp: string;
  }>;
  insights: {
    cost_trend: string;
    most_used_provider: string;
    most_used_alias: string;
    error_rate: number;
  };
}

export function AIUsageDashboard() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [showDetails, setShowDetails] = useState(false);

  const fetchUsageMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ai-usage?workspace_id=1&timeframe=${selectedTimeframe}`);
      setMetrics(response);
    } catch (error) {
      console.error('Failed to fetch AI usage metrics:', error);
      toast.error('Failed to load usage metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    fetchUsageMetrics();
  }, [fetchUsageMetrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getProviderDisplayName = (providerName: string) => {
    const displayNames: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'mistral': 'Mistral AI',
      'groq': 'Groq',
      'zhipu': 'Zhipu AI',
      'openrouter': 'OpenRouter',
      'replicate': 'Replicate'
    };
    return displayNames[providerName] || providerName;
  };

  const getErrorSeverity = (errorRate: number) => {
    if (errorRate >= 10) return 'high';
    if (errorRate >= 5) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage & Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage & Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No usage data available</p>
            <Button variant="outline" onClick={fetchUsageMetrics} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.summary.total_calls)}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Avg: {Math.round(metrics.summary.avg_tokens_per_call)} tokens/call
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.summary.total_cost_usd)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Avg: {formatCurrency(metrics.summary.avg_cost_per_call)}/call
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{metrics.summary.error_rate_percent.toFixed(1)}%</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${
                getErrorSeverity(metrics.summary.error_rate_percent) === 'high' ? 'text-red-600' :
                getErrorSeverity(metrics.summary.error_rate_percent) === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.recent_errors.length} recent errors
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage by Provider
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last Day</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={fetchUsageMetrics}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.by_provider).map(([provider, data]) => (
              <div key={provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getProviderDisplayName(provider)}</span>
                    <Badge variant="outline">
                      {data.success_rate}% success
                    </Badge>
                    <Badge variant="outline">
                      {data.avg_latency}ms avg
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(data.calls)} calls • {formatCurrency(data.cost)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-medium">{formatNumber(data.calls)}</div>
                    <div className="text-muted-foreground">Calls</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(data.tokens)}</div>
                    <div className="text-muted-foreground">Tokens</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatCurrency(data.cost)}</div>
                    <div className="text-muted-foreground">Cost</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage by Alias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage by Alias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.by_alias).map(([alias, data]) => (
              <div key={alias} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{alias}</span>
                    <Badge variant="outline">
                      {data.success_rate}% success
                    </Badge>
                    {data.fallback_rate > 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        {data.fallback_rate}% fallback
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(data.calls)} calls • {formatCurrency(data.cost)}
                  </div>
                </div>
                <Progress 
                  value={(data.calls / metrics.summary.total_calls) * 100} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {metrics.recent_errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Errors
              <Badge variant="destructive">
                {metrics.recent_errors.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recent_errors.slice(0, 5).map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{getProviderDisplayName(error.provider)}</p>
                        <p className="text-sm">{error.error}</p>
                      </div>
                      <span className="text-xs">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              
              {metrics.recent_errors.length > 5 && (
                <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Errors
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Most Used Provider</h4>
              <p className="text-sm text-muted-foreground">
                {getProviderDisplayName(metrics.insights.most_used_provider)} is your primary choice
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Most Used Alias</h4>
              <p className="text-sm text-muted-foreground">
                <code className="bg-muted px-1 rounded">{metrics.insights.most_used_alias}</code> gets the most usage
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Cost Trend</h4>
              <p className="text-sm text-muted-foreground">
                Spending is {metrics.insights.cost_trend} compared to previous period
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Reliability</h4>
              <p className="text-sm text-muted-foreground">
                {100 - metrics.insights.error_rate}% of requests succeed on first try
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
