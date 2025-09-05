
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, MessageSquare, Heart, Share } from "lucide-react";

interface PlatformPreviewProps {
  selectedPlatforms: number[];
  title: string;
  content: string;
  tags: string[];
  connections: Array<{
    id: number;
    platform_type: string;
    connection_name: string;
  }>;
}

export function PlatformPreview({ 
  selectedPlatforms, 
  title, 
  content, 
  tags, 
  connections 
}: PlatformPreviewProps) {
  const selectedConnections = connections.filter(conn => 
    selectedPlatforms.includes(conn.id)
  );

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

  const renderDiscordPreview = () => (
    <div className="bg-[#36393f] text-white p-4 rounded-lg font-mono text-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs">
          B
        </div>
        <span className="text-blue-400 font-semibold">Bot</span>
        <span className="text-xs text-gray-400">Today at 12:00 PM</span>
      </div>
      {title && <div className="font-bold mb-1">{title}</div>}
      <div className="whitespace-pre-wrap">{content}</div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag, index) => (
            <span key={index} className="text-blue-400">#{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>0</span>
        </div>
      </div>
    </div>
  );

  const renderTelegramPreview = () => (
    <div className="bg-white border rounded-lg p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
          C
        </div>
        <div>
          <div className="font-semibold text-sm">Channel Name</div>
          <div className="text-xs text-gray-500">12:00 PM</div>
        </div>
      </div>
      {title && <div className="font-bold mb-1">{title}</div>}
      <div className="text-sm whitespace-pre-wrap">{content}</div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag, index) => (
            <span key={index} className="text-blue-500 text-sm">#{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 text-gray-400 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="h-3 w-3" />
          <span>0 views</span>
        </div>
        <Share className="h-3 w-3" />
      </div>
    </div>
  );

  const renderWhopPreview = () => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">
          W
        </div>
        <div>
          <div className="font-semibold text-sm">Community Update</div>
          <div className="text-xs text-gray-500">Just now</div>
        </div>
      </div>
      {title && <div className="font-bold mb-1 text-purple-900">{title}</div>}
      <div className="text-sm whitespace-pre-wrap text-gray-800">{content}</div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 text-gray-500 text-xs">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>0</span>
        </div>
      </div>
    </div>
  );

  const renderPreview = (platform: string) => {
    switch (platform) {
      case 'discord':
        return renderDiscordPreview();
      case 'telegram':
        return renderTelegramPreview();
      case 'whop':
        return renderWhopPreview();
      default:
        return (
          <div className="border rounded-lg p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Preview not available for this platform
            </p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedConnections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select platforms to see preview</p>
          </div>
        ) : selectedConnections.length === 1 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getPlatformIcon(selectedConnections[0].platform_type)}
              </span>
              <Badge variant="outline">
                {selectedConnections[0].platform_type}
              </Badge>
            </div>
            {renderPreview(selectedConnections[0].platform_type)}
          </div>
        ) : (
          <Tabs defaultValue={selectedConnections[0]?.id.toString()}>
            <TabsList className="grid w-full grid-cols-3">
              {selectedConnections.map((connection) => (
                <TabsTrigger key={connection.id} value={connection.id.toString()}>
                  <span className="mr-1">
                    {getPlatformIcon(connection.platform_type)}
                  </span>
                  {connection.platform_type}
                </TabsTrigger>
              ))}
            </TabsList>
            {selectedConnections.map((connection) => (
              <TabsContent key={connection.id} value={connection.id.toString()}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {connection.connection_name}
                    </Badge>
                  </div>
                  {renderPreview(connection.platform_type)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
