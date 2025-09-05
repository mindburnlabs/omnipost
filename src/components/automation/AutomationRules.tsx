
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Clock,
  MessageSquare,
  Calendar,
  Hash,
  Target,
  Edit,
  Trash2,
  TestTube,
  History,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
  burst_protection?: {
    max_runs_per_hour: number;
    max_runs_per_day: number;
    current_hour_runs: number;
    current_day_runs: number;
  };
  created_at: string;
}

interface DryRunResult {
  ruleId: number;
  ruleName: string;
  wouldTrigger: boolean;
  actions: Array<{
    type: string;
    description: string;
    parameters: Record<string, any>;
    estimatedOutcome: string;
  }>;
  burstProtectionStatus: {
    allowed: boolean;
    reason?: string;
    remainingRuns: number;
  };
}

export function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDryRunDialog, setShowDryRunDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    trigger_type: "schedule",
    trigger_conditions: {},
    actions: {},
    is_active: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await api.get('/automation-rules');
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch automation rules:', error);
      // No mock data fallback - show empty state
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim() || !newRule.trigger_type) {
      toast.error("Name and trigger type are required");
      return;
    }

    try {
      const rule = await api.post('/automation-rules', newRule);
      setRules(prev => [rule, ...prev]);
      setNewRule({
        name: "",
        description: "",
        trigger_type: "schedule",
        trigger_conditions: {},
        actions: {},
        is_active: true
      });
      setShowCreateDialog(false);
      toast.success("Automation rule created successfully!");
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast.error("Failed to create automation rule");
    }
  };

  const handleToggleRule = async (ruleId: number, isActive: boolean) => {
    try {
      await api.put(`/automation-rules/${ruleId}`, { is_active: !isActive });
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: !isActive } : rule
      ));
      toast.success(isActive ? "Rule paused" : "Rule activated");
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast.error("Failed to update rule");
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await api.delete(`/automation-rules/${ruleId}`);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success("Automation rule deleted");
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast.error("Failed to delete rule");
    }
  };

  const handleDryRun = async (rule: AutomationRule) => {
    setSelectedRule(rule);
    setDryRunning(true);
    setShowDryRunDialog(true);
    
    try {
      const result = await api.post(`/automation-rules/${rule.id}/dry-run`);
      setDryRunResult(result);
    } catch (error) {
      console.error('Dry run failed:', error);
      toast.error("Dry run failed");
      setDryRunResult(null);
    } finally {
      setDryRunning(false);
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'schedule':
        return Clock;
      case 'engagement_threshold':
        return Target;
      case 'new_post':
        return MessageSquare;
      case 'hashtag':
        return Hash;
      default:
        return Zap;
    }
  };

  const getTriggerColor = (triggerType: string) => {
    switch (triggerType) {
      case 'schedule':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'engagement_threshold':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'new_post':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTriggerDescription = (rule: AutomationRule) => {
    switch (rule.trigger_type) {
      case 'schedule':
        const conditions = rule.trigger_conditions;
        if (conditions.frequency === 'weekly') {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `Every ${days[conditions.day_of_week]} at ${conditions.hour}:00`;
        }
        return 'Scheduled trigger';
      case 'engagement_threshold':
        return `When ${rule.trigger_conditions.metric} > ${rule.trigger_conditions.threshold}`;
      default:
        return rule.trigger_type.replace('_', ' ');
    }
  };

  const getBurstProtectionStatus = (rule: AutomationRule) => {
    if (!rule.burst_protection) return null;
    
    const { current_hour_runs, max_runs_per_hour, current_day_runs, max_runs_per_day } = rule.burst_protection;
    const hourlyUsage = (current_hour_runs / max_runs_per_hour) * 100;
    const dailyUsage = (current_day_runs / max_runs_per_day) * 100;
    
    if (hourlyUsage >= 100 || dailyUsage >= 100) {
      return { status: 'blocked', message: 'Rate limit reached' };
    } else if (hourlyUsage >= 80 || dailyUsage >= 80) {
      return { status: 'warning', message: 'Approaching rate limit' };
    }
    
    return { status: 'ok', message: 'Within limits' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automation Rules
              <Badge variant="secondary">
                {rules.filter(r => r.is_active).length} active
              </Badge>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        placeholder="e.g., Weekly Update"
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trigger-type">Trigger Type</Label>
                      <Select
                        value={newRule.trigger_type}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="schedule">Schedule</SelectItem>
                          <SelectItem value="engagement_threshold">Engagement Threshold</SelectItem>
                          <SelectItem value="new_post">New Post Created</SelectItem>
                          <SelectItem value="hashtag">Hashtag Mention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rule-description">Description (Optional)</Label>
                    <Textarea
                      id="rule-description"
                      placeholder="Describe what this rule does..."
                      value={newRule.description}
                      onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newRule.is_active}
                      onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Activate immediately</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRule}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No automation rules yet</p>
              <p className="text-sm mb-4">Create rules to automate repetitive tasks</p>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => {
                const TriggerIcon = getTriggerIcon(rule.trigger_type);
                const burstStatus = getBurstProtectionStatus(rule);
                
                return (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            <TriggerIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{rule.name}</h4>
                              <Badge className={getTriggerColor(rule.trigger_type)}>
                                {rule.trigger_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant={rule.is_active ? "default" : "secondary"}>
                                {rule.is_active ? 'Active' : 'Paused'}
                              </Badge>
                              {burstStatus && burstStatus.status !== 'ok' && (
                                <Badge variant={burstStatus.status === 'blocked' ? 'destructive' : 'outline'}>
                                  <Shield className="h-3 w-3 mr-1" />
                                  {burstStatus.message}
                                </Badge>
                              )}
                            </div>
                            
                            {rule.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {rule.description}
                              </p>
                            )}
                            
                            <p className="text-sm font-medium mb-2">
                              Trigger: {formatTriggerDescription(rule)}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Runs: {rule.run_count}</span>
                              {rule.last_run_at && (
                                <span>Last: {new Date(rule.last_run_at).toLocaleDateString()}</span>
                              )}
                              {rule.burst_protection && (
                                <span>
                                  Limits: {rule.burst_protection.current_hour_runs}/{rule.burst_protection.max_runs_per_hour}/hr, 
                                  {rule.burst_protection.current_day_runs}/{rule.burst_protection.max_runs_per_day}/day
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDryRun(rule)}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <History className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                          />
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dry Run Dialog */}
      <Dialog open={showDryRunDialog} onOpenChange={setShowDryRunDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Dry Run Preview: {selectedRule?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dryRunning ? (
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 mx-auto mb-4 animate-pulse text-blue-600" />
                <p>Analyzing rule conditions...</p>
              </div>
            ) : dryRunResult ? (
              <div className="space-y-4">
                {/* Trigger Status */}
                <Alert variant={dryRunResult.wouldTrigger ? "default" : "destructive"}>
                  {dryRunResult.wouldTrigger ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {dryRunResult.wouldTrigger 
                      ? "Rule conditions are met - would trigger now"
                      : "Rule conditions not met - would not trigger"
                    }
                  </AlertDescription>
                </Alert>

                {/* Burst Protection Status */}
                {!dryRunResult.burstProtectionStatus.allowed && (
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Blocked by burst protection: {dryRunResult.burstProtectionStatus.reason}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium">Actions that would be executed:</h4>
                  {dryRunResult.actions.map((action, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{action.type}</Badge>
                        <span className="font-medium text-sm">{action.description}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {action.estimatedOutcome}
                      </p>
                      {Object.keys(action.parameters).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            View parameters
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1">
                            {JSON.stringify(action.parameters, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Click "Run Dry Run" to preview what this rule would do</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
