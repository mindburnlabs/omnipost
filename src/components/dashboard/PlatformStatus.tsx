
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { platformConnectionsApi } from "@/lib/omnipost-api";
import { PlatformConnection } from "@/types/omnipost";

export function PlatformStatus() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await platformConnectionsApi.getAll();
        setConnections(data);
      } catch (error) {
        console.error('Failed to fetch platform connections:', error);
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
            connection_status: 'error',
            error_message: 'API key expired',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'inactive':
      case 'expired':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'inactive':
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Platform Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Platform Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No platforms connected</p>
            <Button variant="outline" size="sm">
              Connect Platform
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {getPlatformIcon(connection.platform_type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {connection.connection_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {connection.platform_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connection.connection_status)}
                  <Badge className={getStatusColor(connection.connection_status)}>
                    {connection.connection_status}
                  </Badge>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              Manage Connections
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
