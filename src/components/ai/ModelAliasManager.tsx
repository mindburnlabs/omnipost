
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
  Zap, 
  Plus, 
  Settings, 
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Target,
  Gauge,
  DollarSign,
  Shield
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { getAIProviderSystem } from "@/lib/ai-provider-system";
import { ProviderModel, AIProvider } from "@/types/ai";

type ModalityType = 'text' | 'image' | 'audio' | 'video';
type CapabilityType = 'chat' | 'completion' | 'embedding' | 'generate' | 'edit' | 'variation' | 'stt' | 'tts' | 'caption';
type RoutingPreferenceType = 'quality' | 'speed' | 'cost';

interface ModelAlias {
  id: number;
  alias_name: string;
  display_name: string;
  modality: ModalityType;
  capability: string;
  primary_provider: string;
  primary_model: string;
  fallback_chain: Array<{
    provider: string;
    model: string;
    priority: number;
  }>;
  routing_preference: RoutingPreferenceType;
  allow_aggregators: boolean;
  is_active: boolean;
  primary_key_status: string;
  primary_budget_status: string;
  fallback_status: Array<{
    provider: string;
    status: string;
    budget_status: string;
  }>;
  total_providers: number;
  healthy_providers: number;
}

interface NewAliasState {
  alias_name: string;
  display_name: string;
  modality: ModalityType;
  capability: CapabilityType;
  primary_provider: string;
  primary_model: string;
  fallback_chain: Array<{ provider: string; model: string; priority: number }>;
  routing_preference: RoutingPreferenceType;
  allow_aggregators: boolean;
}

export function ModelAliasManager() {
  const [aliases, setAliases] = useState<ModelAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<Record<string, AIProvider>>({});
  const [newAlias, setNewAlias] = useState<NewAliasState>({
    alias_name: '',
    display_name: '',
    modality: 'text',
    capability: 'chat',
    primary_provider: '',
    primary_model: '',
    fallback_chain: [],
    routing_preference: 'quality',
    allow_aggregators: false
  });

  useEffect(() => {
    fetchAliases();
    fetchProviders();
  }, []);

  const fetchAliases = async () => {
    try {
      const response = await api.get('/ai-aliases?workspace_id=1');
      setAliases(response.aliases);
    } catch (error) {
      console.error('Failed to fetch AI aliases:', error);
      toast.error('Failed to load model aliases');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const aiSystem = await getAIProviderSystem();
      const providers = aiSystem.getAvailableProviders();
      setAvailableProviders(providers);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleCreateAlias = async () => {
    if (!newAlias.alias_name || !newAlias.display_name || !newAlias.primary_provider) {
      toast.error("Alias name, display name, and primary provider are required");
      return;
    }

    try {
      const response = await api.post('/ai-aliases', {
        ...newAlias,
        workspace_id: 1
      });

      setAliases(prev => [response, ...prev]);
      setNewAlias({
        alias_name: '',
        display_name: '',
        modality: 'text',
        capability: 'chat',
        primary_provider: '',
        primary_model: '',
        fallback_chain: [],
        routing_preference: 'quality',
        allow_aggregators: false
      });
      setShowCreateDialog(false);
      toast.success("Model alias created successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to create model alias");
    }
  };

  const handleSetupDefaults = async () => {
    try {
      await api.post('/ai-setup/defaults', { workspace_id: 1 });
      await fetchAliases();
      toast.success("Default aliases created! Add your API keys to activate them.");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to setup default aliases");
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'video': return '🎬';
      default: return '🤖';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missing_key':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'invalid':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'exceeded':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoutingIcon = (preference: string) => {
    switch (preference) {
      case 'quality': return <Target className="h-4 w-4" />;
      case 'speed': return <Gauge className="h-4 w-4" />;
      case 'cost': return <DollarSign className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  // Helper function to get properly typed models for a provider
  const getProviderModels = (providerName: string): ProviderModel[] => {
    const provider = availableProviders[providerName];
    if (!provider || !provider.models) {
      return [];
    }
    
    return Object.entries(provider.models).map(([key, name]) => ({
      key,
      name: String(name), // Ensure name is always a string
      description: `${provider.display_name} model`,
      capabilities: provider.features
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Aliases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
            <Zap className="h-5 w-5" />
            Model Aliases
            <Badge variant="secondary">
              {aliases.filter(a => a.is_active).length} active
            </Badge>
          </div>
          <div className="flex gap-2">
            {aliases.length === 0 && (
              <Button variant="outline" onClick={handleSetupDefaults}>
                <Settings className="h-4 w-4 mr-2" />
                Setup Defaults
              </Button>
            )}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alias
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Model Alias</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Aliases provide friendly names for AI models with automatic fallbacks. 
                      Your content features will use these aliases instead of specific providers.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alias_name">Alias Name *</Label>
                      <Input
                        id="alias_name"
                        placeholder="e.g., default-writer"
                        value={newAlias.alias_name}
                        onChange={(e) => setNewAlias(prev => ({ ...prev, alias_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name *</Label>
                      <Input
                        id="display_name"
                        placeholder="e.g., Default Writer"
                        value={newAlias.display_name}
                        onChange={(e) => setNewAlias(prev => ({ ...prev, display_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modality">Modality *</Label>
                      <Select
                        value={newAlias.modality}
                        onValueChange={(value: ModalityType) => 
                          setNewAlias(prev => ({ ...prev, modality: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">📝 Text</SelectItem>
                          <SelectItem value="image">🖼️ Image</SelectItem>
                          <SelectItem value="audio">🎵 Audio</SelectItem>
                          <SelectItem value="video">🎬 Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capability">Capability *</Label>
                      <Select
                        value={newAlias.capability}
                        onValueChange={(value: CapabilityType) => setNewAlias(prev => ({ ...prev, capability: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {newAlias.modality === 'text' && (
                            <>
                              <SelectItem value="chat">Chat</SelectItem>
                              <SelectItem value="completion">Completion</SelectItem>
                              <SelectItem value="embedding">Embedding</SelectItem>
                            </>
                          )}
                          {newAlias.modality === 'image' && (
                            <>
                              <SelectItem value="generate">Generate</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                              <SelectItem value="variation">Variation</SelectItem>
                            </>
                          )}
                          {newAlias.modality === 'audio' && (
                            <>
                              <SelectItem value="stt">Speech-to-Text</SelectItem>
                              <SelectItem value="tts">Text-to-Speech</SelectItem>
                            </>
                          )}
                          {newAlias.modality === 'video' && (
                            <>
                              <SelectItem value="generate">Generate</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                              <SelectItem value="caption">Caption</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_provider">Primary Provider *</Label>
                      <Select
                        value={newAlias.primary_provider}
                        onValueChange={(value) => setNewAlias(prev => ({ 
                          ...prev, 
                          primary_provider: value,
                          primary_model: '' // Reset model when provider changes
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(availableProviders)
                            .filter(p => p.supported_modalities.includes(newAlias.modality))
                            .map((provider) => (
                              <SelectItem key={provider.name} value={provider.name}>
                                <div className="flex items-center gap-2">
                                  <span>{provider.display_name}</span>
                                  <Badge variant={provider.tier === 1 ? "default" : "secondary"}>
                                    Tier {provider.tier}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_model">Primary Model *</Label>
                      <Select
                        value={newAlias.primary_model}
                        onValueChange={(value) => setNewAlias(prev => ({ ...prev, primary_model: value }))}
                        disabled={!newAlias.primary_provider}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProviderModels(newAlias.primary_provider).map((model) => (
                            <SelectItem key={model.key} value={model.key}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Routing Preferences</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="quality"
                          name="routing"
                          checked={newAlias.routing_preference === 'quality'}
                          onChange={() => setNewAlias(prev => ({ ...prev, routing_preference: 'quality' }))}
                        />
                        <Label htmlFor="quality" className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Quality
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="speed"
                          name="routing"
                          checked={newAlias.routing_preference === 'speed'}
                          onChange={() => setNewAlias(prev => ({ ...prev, routing_preference: 'speed' }))}
                        />
                        <Label htmlFor="speed" className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          Speed
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="cost"
                          name="routing"
                          checked={newAlias.routing_preference === 'cost'}
                          onChange={() => setNewAlias(prev => ({ ...prev, routing_preference: 'cost' }))}
                        />
                        <Label htmlFor="cost" className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Cost
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newAlias.allow_aggregators}
                      onCheckedChange={(checked) => 
                        setNewAlias(prev => ({ ...prev, allow_aggregators: checked }))
                      }
                    />
                    <Label>Allow aggregators as fallback</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAlias}>
                      Create Alias
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aliases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No model aliases configured</p>
            <p className="text-sm mb-4">Aliases provide friendly names for AI models with automatic fallbacks</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleSetupDefaults}>
                <Settings className="h-4 w-4 mr-2" />
                Setup Defaults
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Alias
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {aliases.map((alias) => (
              <Card key={alias.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-2xl">
                        {getModalityIcon(alias.modality)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{alias.display_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {alias.alias_name}
                          </Badge>
                          <Badge variant="outline">
                            {alias.capability}
                          </Badge>
                          {getStatusIcon(alias.primary_key_status)}
                        </div>
                        
                        <div className="space-y-2">
                          {/* Primary Provider */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Primary:</span>
                            <Badge variant="default">
                              {availableProviders[alias.primary_provider]?.display_name || alias.primary_provider}
                            </Badge>
                            <Badge className={getBudgetStatusColor(alias.primary_budget_status)}>
                              {alias.primary_budget_status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Fallback Chain */}
                          {alias.fallback_chain.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Fallbacks:</span>
                              <div className="flex items-center gap-1">
                                {alias.fallback_chain.map((fallback, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                                    <Badge variant="outline" className="text-xs">
                                      {availableProviders[fallback.provider]?.display_name || fallback.provider}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Routing Preferences */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {getRoutingIcon(alias.routing_preference)}
                              <span>Prefers {alias.routing_preference}</span>
                            </div>
                            {alias.allow_aggregators && (
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                <span>Allows aggregators</span>
                              </div>
                            )}
                            <div>
                              Health: {alias.healthy_providers}/{alias.total_providers} providers
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alias.is_active}
                        onCheckedChange={(checked) => {
                          // Update alias status
                          setAliases(prev => prev.map(a => 
                            a.id === alias.id ? { ...a, is_active: checked } : a
                          ));
                        }}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
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
