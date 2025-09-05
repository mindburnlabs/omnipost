

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function PlatformSetup() {
  const [loading, setLoading] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  
  // Discord setup state
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordServerName, setDiscordServerName] = useState("");
  
  // Telegram setup state
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramConnectionName, setTelegramConnectionName] = useState("");
  
  // Whop setup state
  const [whopConnectionName, setWhopConnectionName] = useState("");

  const handleDiscordSetup = async () => {
    if (!discordWebhook.trim()) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }

    setLoading(true);
    try {
      await api.post('/platform-connections/discord/webhook', {
        webhook_url: discordWebhook,
        connection_name: discordServerName || undefined,
        server_name: discordServerName || undefined
      });
      
      toast.success("Discord connection created successfully!");
      setDiscordWebhook("");
      setDiscordServerName("");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to setup Discord connection");
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramSetup = async () => {
    if (!telegramChatId.trim()) {
      toast.error("Please enter a Telegram chat ID or username");
      return;
    }

    setLoading(true);
    try {
      await api.post('/platform-connections/telegram/setup', {
        chat_id: telegramChatId,
        connection_name: telegramConnectionName || undefined,
        chat_type: telegramChatId.startsWith('@') ? 'channel' : 'group'
      });
      
      toast.success("Telegram connection created successfully!");
      setTelegramChatId("");
      setTelegramConnectionName("");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to setup Telegram connection");
    } finally {
      setLoading(false);
    }
  };

  const handleWhopSetup = async () => {
    setLoading(true);
    try {
      await api.post('/platform-connections/whop/setup', {
        connection_name: whopConnectionName || undefined
      });
      
      toast.success("Whop connection created successfully!");
      setWhopConnectionName("");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to setup Whop connection");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSetup = async () => {
    setLoading(true);
    try {
      await api.post('/platform-connections/setup', {
        setupType: 'demo'
      });
      
      toast.success("Demo connections created successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to setup demo connections");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Quick Demo Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get started quickly with demo connections to test OmniPost functionality.
            </p>
            <Button onClick={handleDemoSetup} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Setting up...' : 'Create Demo Connections'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Credentials Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🔑 API Credentials
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTokens(!showTokens)}
            >
              {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telegram Bot Token</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={showTokens ? process.env.TELEGRAM_BOT_TOKEN || 'Not configured' : '••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(process.env.TELEGRAM_BOT_TOKEN || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Discord Application ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={showTokens ? process.env.DISCORD_APPLICATION_ID || 'Not configured' : '••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(process.env.DISCORD_APPLICATION_ID || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Whop Company ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={showTokens ? process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'Not configured' : '••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Whop App ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={showTokens ? process.env.NEXT_PUBLIC_WHOP_APP_ID || 'Not configured' : '••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_WHOP_APP_ID || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Setup Tabs */}
      <Tabs defaultValue="discord" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discord">🎮 Discord</TabsTrigger>
          <TabsTrigger value="telegram">✈️ Telegram</TabsTrigger>
          <TabsTrigger value="whop">🛍️ Whop</TabsTrigger>
        </TabsList>

        {/* Discord Setup */}
        <TabsContent value="discord">
          <Card>
            <CardHeader>
              <CardTitle>Discord Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To connect Discord, you need to create a webhook in your Discord server. 
                  <Button variant="link" className="p-0 h-auto ml-1" asChild>
                    <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank">
                      Learn how <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="discord-webhook">Webhook URL *</Label>
                <Input
                  id="discord-webhook"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discord-server">Server Name (Optional)</Label>
                <Input
                  id="discord-server"
                  placeholder="My Discord Server"
                  value={discordServerName}
                  onChange={(e) => setDiscordServerName(e.target.value)}
                />
              </div>
              
              <Button onClick={handleDiscordSetup} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Connect Discord'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Setup */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bot Token: <code className="bg-muted px-1 rounded">8412223612:AAECssq8uLfGU8uUs819RJhVWmvXfasDmAE</code>
                  <br />
                  Bot Username: <code className="bg-muted px-1 rounded">@op_whop_bot</code>
                  <br />
                  Add this bot to your channel/group and make it an admin to post messages.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="telegram-chat">Chat ID or Username *</Label>
                <Input
                  id="telegram-chat"
                  placeholder="@your_channel or -1001234567890"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use @username for public channels or the numeric chat ID for private groups
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegram-name">Connection Name (Optional)</Label>
                <Input
                  id="telegram-name"
                  placeholder="My Telegram Channel"
                  value={telegramConnectionName}
                  onChange={(e) => setTelegramConnectionName(e.target.value)}
                />
              </div>
              
              <Button onClick={handleTelegramSetup} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Connect Telegram'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Whop Setup */}
        <TabsContent value="whop">
          <Card>
            <CardHeader>
              <CardTitle>Whop Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Whop API credentials are already configured. Click connect to set up the integration.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="whop-name">Connection Name (Optional)</Label>
                <Input
                  id="whop-name"
                  placeholder="My Whop Community"
                  value={whopConnectionName}
                  onChange={(e) => setWhopConnectionName(e.target.value)}
                />
              </div>
              
              <Button onClick={handleWhopSetup} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Connect Whop'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

