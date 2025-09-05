
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { platformConnectionsApi } from "@/lib/omnipost-api";
import { PlatformConnection } from "@/types/omnipost";

interface PlatformSelectorProps {
  selectedPlatforms: number[];
  onPlatformChange: (platformIds: number[]) => void;
}

export function PlatformSelector({ selectedPlatforms, onPlatformChange }: PlatformSelectorProps) {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await platformConnectionsApi.getAll();
        setConnections(data.filter(conn => conn.connection_status === 'active'));
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
            connection_status: 'active',
            last_sync_at: new Date().toISOString(),
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

  const handlePlatformToggle = (platformId: number, checked: boolean) => {
    if (checked) {
      onPlatformChange([...selectedPlatforms, platformId]);
    } else {
      onPlatformChange(selectedPlatforms.filter(id => id !== platformId));
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

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'discord':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'telegram':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'whop':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Destinations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        <CardTitle className="flex items-center justify-between">
          Platform Destinations
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">📱</div>
            <p className="mb-4">No active platform connections</p>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Connect Platform
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {connections.map((connection) => (
                <div key={connection.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id={`platform-${connection.id}`}
                    checked={selectedPlatforms.includes(connection.id)}
                    onCheckedChange={(checked) => 
                      handlePlatformToggle(connection.id, checked as boolean)
                    }
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">
                      {getPlatformIcon(connection.platform_type)}
                    </span>
                    <div className="flex-1">
                      <label 
                        htmlFor={`platform-${connection.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {connection.connection_name}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPlatformColor(connection.platform_type)}>
                          {connection.platform_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPlatforms.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
