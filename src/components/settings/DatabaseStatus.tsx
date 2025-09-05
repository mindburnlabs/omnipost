
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface DatabaseHealth {
  connected: boolean;
  responseTime: number;
  tablesAccessible: boolean;
  allTablesOk: boolean;
  issues?: string[];
  error?: string;
}

export function DatabaseStatus() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  const fetchHealth = async () => {
    try {
      const data = await api.get('/system/health');
      setHealth(data.database);
    } catch (error) {
      console.error('Failed to fetch database health:', error);
      setHealth({
        connected: false,
        responseTime: 0,
        tablesAccessible: false,
        allTablesOk: false,
        error: 'Failed to check database health'
      });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setMigrating(true);
    try {
      const result = await api.post('/database/migrate');
      
      if (result.migration_needed) {
        toast.error('Database migration required. Please run the provided SQL command.');
        console.log('Migration SQL:', result.sql_command);
      } else {
        toast.success('All database tables are properly configured');
      }
      
      // Refresh health status
      await fetchHealth();
    } catch (error: any) {
      toast.error(error.errorMessage || 'Failed to check database migration');
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getHealthIcon = () => {
    if (!health) return <Database className="h-4 w-4 text-gray-400" />;
    
    if (health.connected && health.allTablesOk) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (health.connected) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getHealthColor = () => {
    if (!health) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    
    if (health.connected && health.allTablesOk) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (health.connected) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  const getHealthStatus = () => {
    if (!health) return 'Unknown';
    
    if (health.connected && health.allTablesOk) {
      return 'Healthy';
    } else if (health.connected) {
      return 'Issues Detected';
    } else {
      return 'Connection Failed';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
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
            <Database className="h-5 w-5" />
            Database Status
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getHealthColor()}>
              <div className="flex items-center gap-1">
                {getHealthIcon()}
                <span className="text-xs">{getHealthStatus()}</span>
              </div>
            </Badge>
            <Button variant="ghost" size="sm" onClick={fetchHealth}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {health && (
          <>
            {/* Connection Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Connection:</span>
                <div className="font-medium">
                  {health.connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Response Time:</span>
                <div className="font-medium">{health.responseTime}ms</div>
              </div>
              <div>
                <span className="text-muted-foreground">Tables:</span>
                <div className="font-medium">
                  {health.tablesAccessible ? 'Accessible' : 'Not Accessible'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Schema:</span>
                <div className="font-medium">
                  {health.allTablesOk ? 'Complete' : 'Issues Found'}
                </div>
              </div>
            </div>

            {/* Issues */}
            {health.issues && health.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Database Issues Detected:</p>
                    <ul className="list-disc list-inside text-sm">
                      {health.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {health.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {health.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Migration Button */}
            {!health.allTablesOk && (
              <div className="flex gap-2">
                <Button
                  onClick={runMigration}
                  disabled={migrating}
                  variant="outline"
                >
                  {migrating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  {migrating ? 'Checking...' : 'Check Migration'}
                </Button>
              </div>
            )}

            {/* Success Message */}
            {health.connected && health.allTablesOk && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Database is properly configured and all tables are accessible.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
