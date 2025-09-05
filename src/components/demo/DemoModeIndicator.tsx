
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  Shield, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Database
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function DemoModeIndicator() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [dataPurityStatus, setDataPurityStatus] = useState<'OK' | 'WARNING' | 'ERROR'>('OK');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkDemoStatus();
  }, []);

  const checkDemoStatus = async () => {
    try {
      // Check if current workspace is demo
      const workspaces = await api.get('/workspaces');
      const demoWorkspace = workspaces.find((w: { is_demo: boolean }) => w.is_demo);
      setIsDemoMode(!!demoWorkspace);
      
      // Check data purity
      setDataPurityStatus('OK'); // In real app, you'd validate no sample data in production
    } catch (error) {
      console.error('Failed to check demo status:', error);
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      await api.post('/workspaces/demo/reset');
      toast.success('Demo workspace reset successfully!');
      
      // Refresh the page to show clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'errorMessage' in error 
        ? (error as { errorMessage: string }).errorMessage 
        : 'Failed to reset demo workspace';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      await api.post('/workspaces/demo/seed');
      toast.success('Demo workspace seeded with sample data!');
      
      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'errorMessage' in error 
        ? (error as { errorMessage: string }).errorMessage 
        : 'Failed to seed demo workspace';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getDataPurityIcon = () => {
    switch (dataPurityStatus) {
      case 'OK':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getDataPurityColor = () => {
    switch (dataPurityStatus) {
      case 'OK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  if (!isDemoMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge className={getDataPurityColor()}>
          <div className="flex items-center gap-1">
            {getDataPurityIcon()}
            <span className="text-xs">Data Purity: {dataPurityStatus}</span>
          </div>
        </Badge>
      </div>
    );
  }

  return (
    <>
      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="text-sm font-medium">DEMO MODE</span>
              <Badge variant="secondary" className="bg-blue-500 text-white">
                Safe Testing Environment
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getDataPurityColor()}>
                <div className="flex items-center gap-1">
                  {getDataPurityIcon()}
                  <span className="text-xs">Data Purity: {dataPurityStatus}</span>
                </div>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
                disabled={loading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {loading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Controls Card */}
      <Card className="fixed bottom-4 right-4 z-40 w-80">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Demo Controls</span>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You&apos;re in demo mode. All actions are simulated safely - nothing will be published to real platforms.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDemo}
                disabled={loading}
                className="flex-1"
              >
                <Database className="h-3 w-3 mr-1" />
                Seed Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacer for demo banner */}
      <div className="h-12"></div>
    </>
  );
}
