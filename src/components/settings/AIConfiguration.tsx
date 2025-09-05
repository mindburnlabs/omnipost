
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Key, 
  Zap, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react";
import { AIKeysManager } from "@/components/ai/AIKeysManager";
import { ModelAliasManager } from "@/components/ai/ModelAliasManager";
import { AIUsageDashboard } from "@/components/ai/AIUsageDashboard";

export function AIConfiguration() {
  const [activeTab, setActiveTab] = useState("keys");

  return (
    <div className="space-y-6">
      {/* Overview Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">AI Provider Management</p>
            <p className="text-sm">
              Configure your own API keys for better control, or use system defaults. 
              All AI features use aliases for provider-agnostic routing with automatic fallbacks.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            AI Keys
          </TabsTrigger>
          <TabsTrigger value="aliases" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Model Aliases
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage & Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <AIKeysManager />
        </TabsContent>

        <TabsContent value="aliases" className="space-y-4">
          <ModelAliasManager />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <AIUsageDashboard />
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">BYOK Vault</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API keys are encrypted with workspace-scoped data keys
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Routing Engine</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Alias-based routing with automatic failover is operational
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Budget Monitoring</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Per-workspace budgets with 80%/100% warnings active
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Observability</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Logging
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Per-call metering, latency, and cost tracking enabled
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
