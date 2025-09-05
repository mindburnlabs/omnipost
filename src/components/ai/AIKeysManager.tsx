
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Shield,
  DollarSign,
  Clock,
  Copy
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface AIProviderKey {
  id: number;
  provider_name: string;
  key_label: string;
  api_key_preview: string;
  scopes: {
    text: boolean;
    image: boolean;
    audio: boolean;
    video: boolean;
  };
  status: 'active' | 'inactive' | 'expired' | 'invalid' | 'rotating';
  last_verified: string;
  is_verified: boolean;
  monthly_budget_usd: number;
  monthly_token_limit: number;
  monthly_request_limit: number;
  current_spend_usd?: number;
  current_tokens?: number;
  current_requests?: number;
}

export function AIKeysManager() {
  const [keys, setKeys] = useState<AIProviderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({
    provider: '',
    label: '',
    api_key: '',
    scopes: {
      text: true,
      image: false,
      audio: false,
      video: false
    },
    monthly_budget_usd: 100,
    monthly_token_limit: 1000000,
    monthly_request_limit: 10000
  });

  useEffect(() => {
    fetchKeys();
    fetchProviders();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await api.get('/ai-keys?workspace_id=1');
      setKeys(response.keys);
    } catch (error) {
      console.error('Failed to fetch AI keys:', error);
      toast.error('Failed to load AI keys');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/ai-providers');
      setAvailableProviders(response.providers);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.provider || !newKey.label || !newKey.api_key) {
      toast.error("Provider, label, and API key are required");
      return;
    }

    try {
      const response = await api.post('/ai-keys', {
        ...newKey,
        workspace_id: 1
      });

      setKeys(prev => [response, ...prev]);
      setNewKey({
        provider: '',
        label: '',
        api_key: '',
        scopes: { text: true, image: false, audio: false, video: false },
        monthly_budget_usd: 100,
        monthly_token_limit: 1000000,
        monthly_request_limit: 10000
      });
      setShowAddDialog(false);
      toast.success("AI provider key added successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to add AI key");
    }
  };

  const handleVerifyKey = async (keyId: number) => {
    try {
      await api.post(`/ai-keys/${keyId}/verify`);
      
      // Update local state
      setKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, status: 'active', is_verified: true, last_verified: new Date().toISOString() }
          : key
      ));
      
      toast.success("Key verified successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to verify key");
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    try {
      await api.delete(`/ai-keys/${keyId}`);
      setKeys(prev => prev.filter(key => key.id !== keyId));
      toast.success("Key revoked successfully");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to revoke key");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'invalid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getBudgetUsagePercent = (key: AIProviderKey) => {
    if (!key.monthly_budget_usd || !key.current_spend_usd) return 0;
    return Math.min(100, (key.current_spend_usd / key.monthly_budget_usd) * 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Provider Keys
            <Badge variant="secondary">
              {keys.filter(k => k.status === 'active').length} active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
            >
              {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add AI Provider Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your API keys are encrypted and never exposed to the browser. 
                      All AI calls are made server-side with masked logs.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider *</Label>
                      <Select
                        value={newKey.provider}
                        onValueChange={(value) => setNewKey(prev => ({ ...prev, provider: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.map((provider) => (
                            <SelectItem key={provider.name} value={provider.name}>
                              <div className="flex items-center gap-2">
                                <span>{provider.display_name}</span>
                                <Badge variant={provider.tier === 1 ? "default" : "secondary"}>
                                  Tier {provider.tier}
                                </Badge>
                                {provider.is_aggregator && (
                                  <Badge variant="outline">Aggregator</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="label">Label *</Label>
                      <Input
                        id="label"
                        placeholder="e.g., Main OpenAI Key"
                        value={newKey.label}
                        onChange={(e) => setNewKey(prev => ({ ...prev, label: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key *</Label>
                    <Input
                      id="api_key"
                      type={showApiKeys ? "text" : "password"}
                      placeholder="Enter your API key"
                      value={newKey.api_key}
                      onChange={(e) => setNewKey(prev => ({ ...prev, api_key: e.target.value }))}
                      className="font-mono"
                    />
                  </div>

                  {/* Scopes */}
                  <div className="space-y-3">
                    <Label>Allowed Modalities</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newKey.scopes.text}
                          onCheckedChange={(checked) => 
                            setNewKey(prev => ({ ...prev, scopes: { ...prev.scopes, text: checked } }))
                          }
                        />
                        <Label>Text (chat, completion)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newKey.scopes.image}
                          onCheckedChange={(checked) => 
                            setNewKey(prev => ({ ...prev, scopes: { ...prev.scopes, image: checked } }))
                          }
                        />
                        <Label>Image (generation, analysis)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newKey.scopes.audio}
                          onCheckedChange={(checked) => 
                            setNewKey(prev => ({ ...prev, scopes: { ...prev.scopes, audio: checked } }))
                          }
                        />
                        <Label>Audio (STT, TTS)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newKey.scopes.video}
                          onCheckedChange={(checked) => 
                            setNewKey(prev => ({ ...prev, scopes: { ...prev.scopes, video: checked } }))
                          }
                        />
                        <Label>Video (generation, editing)</Label>
                      </div>
                    </div>
                  </div>

                  {/* Budget Limits */}
                  <div className="space-y-3">
                    <Label>Budget Limits (Monthly)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget_usd">Budget ($)</Label>
                        <Input
                          id="budget_usd"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newKey.monthly_budget_usd}
                          onChange={(e) => setNewKey(prev => ({ 
                            ...prev, 
                            monthly_budget_usd: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="token_limit">Token Limit</Label>
                        <Input
                          id="token_limit"
                          type="number"
                          min="0"
                          value={newKey.monthly_token_limit}
                          onChange={(e) => setNewKey(prev => ({ 
                            ...prev, 
                            monthly_token_limit: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="request_limit">Request Limit</Label>
                        <Input
                          id="request_limit"
                          type="number"
                          min="0"
                          value={newKey.monthly_request_limit}
                          onChange={(e) => setNewKey(prev => ({ 
                            ...prev, 
                            monthly_request_limit: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddKey}>
                      Add & Verify Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No AI provider keys configured</p>
            <p className="text-sm mb-4">Add your own API keys for better control and rate limits</p>
            <Button variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <Card key={key.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(key.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{key.key_label}</h4>
                          <Badge variant="outline">
                            {availableProviders.find(p => p.name === key.provider_name)?.display_name || key.provider_name}
                          </Badge>
                          <Badge className={getStatusColor(key.status)}>
                            {key.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {/* API Key Preview */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Key:</span>
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {showApiKeys ? key.api_key_preview : '••••••••••••••••'}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(key.api_key_preview);
                                toast.success("Key preview copied");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Scopes */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Scopes:</span>
                            <div className="flex gap-1">
                              {Object.entries(key.scopes).map(([scope, enabled]) => (
                                <Badge 
                                  key={scope} 
                                  variant={enabled ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {scope}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Budget Status */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Monthly Budget:</span>
                              <span>
                                {formatCurrency(key.current_spend_usd || 0)} / {formatCurrency(key.monthly_budget_usd)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  getBudgetUsagePercent(key) >= 100 ? 'bg-red-500' :
                                  getBudgetUsagePercent(key) >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, getBudgetUsagePercent(key))}%` }}
                              />
                            </div>
                          </div>

                          {/* Usage Stats */}
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>
                              <div className="font-medium">{formatNumber(key.current_tokens || 0)}</div>
                              <div>Tokens used</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatNumber(key.current_requests || 0)}</div>
                              <div>Requests made</div>
                            </div>
                            <div>
                              <div className="font-medium">
                                {key.last_verified ? new Date(key.last_verified).toLocaleDateString() : 'Never'}
                              </div>
                              <div>Last verified</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {key.status !== 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyKey(key.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
