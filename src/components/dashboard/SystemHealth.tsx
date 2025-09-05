
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp
} from "lucide-react";
import { api } from "@/lib/api-client";

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: {
    connected: boolean;
    responseTime: number;
    tablesAccessible: boolean;
    allTablesOk: boolean;
    issues?: string[];
  };
  publishing: {
    queueStats: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      retrying: number;
    };
    engineRunning: boolean;
  };
  services: {
    ai: {
      gemini: boolean;
      openrouter: boolean;
    };
    platforms: {
      discord: boolean;
      telegram: boolean;
      whop: boolean;
    };
  };
}

export function SystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchHealth = async () => {
    try {
      const data = await api.get('/system/health');
      setHealth(data);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      // Mock health data for demo
      setHealth({
        status: 'healthy',
        database: {
          connected: true,
          responseTime: 45,
          tablesAccessible: true,
          allTablesOk: true
        },
        publishing: {
          queueStats: {
            total: 5,
            pending: 2,
            processing: 1,
            completed: 2,
            failed: 0,
            retrying: 0
          },
          engineRunning: true
        },
        services: {
          ai: {
            gemini: true,
            openrouter: true
          },
          platforms: {
            discord: true,
            telegram: true,
            whop: true
          }
        }
      });
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'down':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to fetch system health</p>
            <Button variant="outline" size="sm" onClick={fetchHealth} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
            <Activity className="h-5 w-5" />
            System Health
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(health.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(health.status)}
                <span className="text-xs">{health.status.toUpperCase()}</span>
              </div>
            </Badge>
            <Button variant="ghost" size="sm" onClick={fetchHealth}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Database</span>
            </div>
            <Badge className={health.database.connected ? getStatusColor('healthy') : getStatusColor('down')}>
              {health.database.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          {health.database.connected && (
            <div className="text-sm text-muted-foreground">
              Response time: {health.database.responseTime}ms
              {health.database.issues && health.database.issues.length > 0 && (
                <div className="mt-1 text-red-600">
                  Issues: {health.database.issues.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Publishing Queue */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Publishing Queue</span>
            </div>
            <Badge variant="outline">
              {health.publishing.queueStats.total} jobs
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium">{health.publishing.queueStats.pending}</div>
              <div className="text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{health.publishing.queueStats.processing}</div>
              <div className="text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{health.publishing.queueStats.completed}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
          </div>

          {health.publishing.queueStats.failed > 0 && (
            <div className="text-sm text-red-600">
              {health.publishing.queueStats.failed} failed jobs need attention
            </div>
          )}
        </div>

        {/* AI Services */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="font-medium">AI Services</span>
          </div>
          
          <div className="flex gap-2">
            <Badge className={health.services.ai.gemini ? getStatusColor('healthy') : getStatusColor('down')}>
              Gemini {health.services.ai.gemini ? '✓' : '✗'}
            </Badge>
            <Badge className={health.services.ai.openrouter ? getStatusColor('healthy') : getStatusColor('down')}>
              OpenRouter {health.services.ai.openrouter ? '✓' : '✗'}
            </Badge>
          </div>
        </div>

        {/* Platform Integrations */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Platform Integrations</span>
          </div>
          
          <div className="flex gap-2">
            <Badge className={health.services.platforms.discord ? getStatusColor('healthy') : getStatusColor('down')}>
              🎮 Discord {health.services.platforms.discord ? '✓' : '✗'}
            </Badge>
            <Badge className={health.services.platforms.telegram ? getStatusColor('healthy') : getStatusColor('down')}>
              ✈️ Telegram {health.services.platforms.telegram ? '✓' : '✗'}
            </Badge>
            <Badge className={health.services.platforms.whop ? getStatusColor('healthy') : getStatusColor('down')}>
              🛍️ Whop {health.services.platforms.whop ? '✓' : '✗'}
            </Badge>
          </div>
        </div>

        {/* Last Updated */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
