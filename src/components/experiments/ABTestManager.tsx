
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  TrendingUp, 
  Trophy, 
  Play, 
  Pause, 
  BarChart3,
  Plus,
  Crown,
  Target,
  Brain,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

// Safe score helper function to handle optional performance_score
function score(v?: { performance_score?: number | null }): number {
  const s = v?.performance_score;
  return typeof s === 'number' && Number.isFinite(s) ? s : 0;
}

interface ABExperiment {
  id: number;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: Array<{
    id: number;
    name: string;
    post_id: number;
    traffic_percentage: number;
    performance_score?: number; // Made optional to match actual data
    content: string;
  }>;
  winner_variant_id?: number;
  confidence_level: number;
  started_at?: string;
  ended_at?: string;
}

interface WinnerAnalysis {
  winnerVariantId: number;
  confidence: number;
  improvement: number;
  significanceLevel: number;
  recommendPromotion: boolean;
  reason: string;
}

export function ABTestManager() {
  const [experiments, setExperiments] = useState<ABExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: "",
    description: "",
    variants: [
      { name: "Variant A", content: "", traffic_percentage: 50 },
      { name: "Variant B", content: "", traffic_percentage: 50 }
    ]
  });

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const data = await api.get('/ab-experiments');
      setExperiments(data);
    } catch (error) {
      console.error('Failed to fetch A/B experiments:', error);
      // Fallback to empty array - no mock data in production
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async () => {
    if (!newExperiment.name.trim()) {
      toast.error("Experiment name is required");
      return;
    }

    if (newExperiment.variants.some(v => !v.content.trim())) {
      toast.error("All variants must have content");
      return;
    }

    try {
      // Create posts for each variant first
      const variantPosts = [];
      for (const variant of newExperiment.variants) {
        try {
          const post = await api.post('/posts', {
            title: `${newExperiment.name} - ${variant.name}`,
            content: variant.content,
            status: 'draft',
            metadata: { 
              ab_test: true,
              experiment_name: newExperiment.name 
            }
          });
          variantPosts.push({
            ...variant,
            post_id: post.id
          });
        } catch (postError) {
          console.error('Failed to create variant post:', postError);
          throw new Error(`Failed to create post for ${variant.name}`);
        }
      }

      // Create experiment
      const experiment = await api.post('/ab-experiments', {
        name: newExperiment.name,
        description: newExperiment.description,
        variants: variantPosts
      });

      setExperiments(prev => [experiment, ...prev]);
      setNewExperiment({
        name: "",
        description: "",
        variants: [
          { name: "Variant A", content: "", traffic_percentage: 50 },
          { name: "Variant B", content: "", traffic_percentage: 50 }
        ]
      });
      setShowCreateDialog(false);
      toast.success("A/B experiment created successfully!");
    } catch (error) {
      console.error('Failed to create experiment:', error);
      toast.error("Failed to create experiment");
    }
  };

  const handleAnalyzeExperiment = async (experimentId: number) => {
    setAnalyzing(experimentId);
    try {
      const analysis: WinnerAnalysis = await api.post(`/ab-experiments/${experimentId}/analyze`);
      
      // Update experiment with analysis results
      setExperiments(prev => prev.map(exp => 
        exp.id === experimentId 
          ? { 
              ...exp, 
              confidence_level: analysis.confidence,
              // Update variant performance scores based on analysis
              variants: exp.variants.map(v => 
                v.id === analysis.winnerVariantId 
                  ? { ...v, performance_score: 100 }
                  : { ...v, performance_score: Math.max(0, 100 - analysis.improvement) }
              )
            }
          : exp
      ));

      if (analysis.recommendPromotion) {
        toast.success(`Clear winner detected! ${analysis.reason}`);
      } else {
        toast.info(analysis.reason);
      }
    } catch (error) {
      console.error('Failed to analyze experiment:', error);
      toast.error("Failed to analyze experiment");
    } finally {
      setAnalyzing(null);
    }
  };

  const handlePromoteWinner = async (experimentId: number, winnerVariantId: number) => {
    try {
      const result = await api.post(`/ab-experiments/${experimentId}/promote-winner`, {
        winner_variant_id: winnerVariantId
      });
      
      // Update local state
      setExperiments(prev => prev.map(exp => 
        exp.id === experimentId 
          ? { ...exp, winner_variant_id: winnerVariantId, status: 'completed' }
          : exp
      ));
      
      toast.success("Winner promoted! Template created and will influence future drafts.");
    } catch (error) {
      console.error('Failed to promote winner:', error);
      toast.error("Failed to promote winner");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getWinner = (experiment: ABExperiment) => {
    if (experiment.winner_variant_id) {
      return experiment.variants.find(v => v.id === experiment.winner_variant_id);
    }
    
    // Auto-detect winner based on performance score using safe score function
    return experiment.variants.reduce((best, current) => {
      return score(current) > score(best) ? current : best;
    });
  };

  const canAnalyze = (experiment: ABExperiment) => {
    return experiment.status === 'running' && 
           experiment.variants.every(v => score(v) > 0);
  };

  const canPromote = (experiment: ABExperiment) => {
    return experiment.status === 'running' && 
           experiment.confidence_level >= 80 &&
           !experiment.winner_variant_id;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>A/B Test Manager</CardTitle>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              A/B Test Manager
              <Badge variant="secondary">
                {experiments.length} experiments
              </Badge>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Experiment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create A/B Test Experiment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-name">Experiment Name</Label>
                    <Input
                      id="exp-name"
                      placeholder="e.g., Product Launch Headlines"
                      value={newExperiment.name}
                      onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-description">Description (Optional)</Label>
                    <Textarea
                      id="exp-description"
                      placeholder="What are you testing and why?"
                      value={newExperiment.description}
                      onChange={(e) => setNewExperiment(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  {/* Variants */}
                  <div className="space-y-4">
                    <Label>Variants</Label>
                    {newExperiment.variants.map((variant, index) => (
                      <div key={index} className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Variant name"
                            value={variant.name}
                            onChange={(e) => {
                              const updatedVariants = [...newExperiment.variants];
                              updatedVariants[index].name = e.target.value;
                              setNewExperiment(prev => ({ ...prev, variants: updatedVariants }));
                            }}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="50"
                            value={variant.traffic_percentage}
                            onChange={(e) => {
                              const updatedVariants = [...newExperiment.variants];
                              updatedVariants[index].traffic_percentage = parseInt(e.target.value) || 50;
                              setNewExperiment(prev => ({ ...prev, variants: updatedVariants }));
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <Textarea
                          placeholder="Enter variant content..."
                          value={variant.content}
                          onChange={(e) => {
                            const updatedVariants = [...newExperiment.variants];
                            updatedVariants[index].content = e.target.value;
                            setNewExperiment(prev => ({ ...prev, variants: updatedVariants }));
                          }}
                          className="min-h-[80px]"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateExperiment}>
                      Create Experiment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {experiments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No A/B experiments yet</p>
              <p className="text-sm mb-4">Create experiments to test different content approaches</p>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Experiment
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {experiments.map((experiment) => {
                const winner = getWinner(experiment);
                const isCompleted = experiment.status === 'completed';
                const isAnalyzing = analyzing === experiment.id;
                
                return (
                  <Card key={experiment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{experiment.name}</h3>
                            <Badge className={getStatusColor(experiment.status)}>
                              {experiment.status}
                            </Badge>
                            {isCompleted && winner && (
                              <Badge variant="outline" className="text-yellow-600">
                                <Crown className="h-3 w-3 mr-1" />
                                Winner: {winner.name}
                              </Badge>
                            )}
                          </div>
                          {experiment.description && (
                            <p className="text-sm text-muted-foreground">
                              {experiment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {experiment.confidence_level > 0 && (
                            <Badge variant="outline">
                              <Target className="h-3 w-3 mr-1" />
                              {experiment.confidence_level}% confidence
                            </Badge>
                          )}
                          {canAnalyze(experiment) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAnalyzeExperiment(experiment.id)}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing ? (
                                <>
                                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  Analyze
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Variants Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {experiment.variants.map((variant) => {
                          const isWinner = winner?.id === variant.id;
                          const performanceScore = score(variant);
                          
                          return (
                            <div 
                              key={variant.id} 
                              className={`p-4 rounded-lg border ${isWinner ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-border'}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">{variant.name}</h4>
                                  {isWinner && (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                  )}
                                </div>
                                <Badge variant="outline">
                                  {variant.traffic_percentage}%
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {variant.content}
                              </p>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>Performance Score</span>
                                  <span className="font-medium">{performanceScore}%</span>
                                </div>
                                <Progress value={performanceScore} className="h-2" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Statistical Analysis Results */}
                      {experiment.confidence_level >= 80 && canPromote(experiment) && winner && (
                        <Alert className="mt-4">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-green-900 dark:text-green-100">
                                  Statistical Significance Achieved!
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  {winner.name} shows {Math.abs(score(winner) - score(experiment.variants.find(v => v.id !== winner.id) || {}))}% improvement with {experiment.confidence_level}% confidence
                                </p>
                              </div>
                              <Button
                                onClick={() => handlePromoteWinner(experiment.id, winner.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Promote Winner
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Low Confidence Warning */}
                      {experiment.status === 'running' && experiment.confidence_level > 0 && experiment.confidence_level < 80 && (
                        <Alert variant="default" className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Need More Data</p>
                                <p className="text-sm text-muted-foreground">
                                  Confidence level: {experiment.confidence_level}% (need 80%+ for reliable results)
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnalyzeExperiment(experiment.id)}
                                disabled={isAnalyzing}
                              >
                                <Brain className="h-4 w-4 mr-2" />
                                Re-analyze
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {experiment.status === 'running' && (
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                          <span>Running for {Math.floor((Date.now() - new Date(experiment.started_at!).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
