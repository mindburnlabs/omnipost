
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { platformConnectionsApi, workspacesApi } from "@/lib/omnipost-api";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  href?: string;
  onClick?: () => void;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSetupDemo = async () => {
    try {
      await workspacesApi.seedDemo();
      toast.success('Demo workspace created! You can now safely explore all features.');
      
      // Mark step as completed
      setSteps(prev => prev.map(step => 
        step.id === 'demo-setup' ? { ...step, completed: true } : step
      ));
      
      // Move to next step
      setCurrentStep(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.errorMessage || 'Failed to set up demo workspace');
    }
  };

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const [connections] = await Promise.all([
        platformConnectionsApi.getAll()
      ]);

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'welcome',
          title: 'Welcome to OmniPost',
          description: 'Get started with your content management journey',
          completed: true,
          action: 'Continue',
        },
        {
          id: 'demo-setup',
          title: 'Set Up Demo Environment',
          description: 'Create a safe demo workspace to explore features',
          completed: false,
          action: 'Create Demo Workspace',
          onClick: handleSetupDemo
        },
        {
          id: 'connect-platforms',
          title: 'Connect Your Platforms',
          description: 'Connect Discord, Telegram, or Whop to start publishing',
          completed: connections.length > 0,
          action: 'Connect Platforms',
          href: '/settings?tab=platforms'
        },
        {
          id: 'ai-setup',
          title: 'Configure AI Assistant',
          description: 'Set up AI to help optimize your content',
          completed: false,
          action: 'Configure AI',
          href: '/settings?tab=ai'
        },
        {
          id: 'first-post',
          title: 'Create Your First Post',
          description: 'Compose and schedule your first piece of content',
          completed: false,
          action: 'Create Post',
          href: '/composer'
        },
        {
          id: 'explore-features',
          title: 'Explore Advanced Features',
          description: 'Discover templates, analytics, and automation',
          completed: false,
          action: 'Explore Features',
          href: '/dashboard'
        }
      ];

      setSteps(onboardingSteps);
      
      // Find current step
      const firstIncomplete = onboardingSteps.findIndex(step => !step.completed);
      setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : onboardingSteps.length - 1);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const handleStepAction = (step: OnboardingStep) => {
    if (step.onClick) {
      step.onClick();
    } else if (step.href) {
      router.push(step.href);
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-2 bg-gray-200 rounded"></div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <Sparkles className="h-5 w-5" />
          Getting Started
          <Badge variant="outline" className="ml-auto">
            {completedSteps}/{steps.length} completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Setup Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                index === currentStep ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className={`h-6 w-6 ${index === currentStep ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{step.title}</h4>
                  {index === currentStep && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                {!step.completed && (
                  <Button
                    variant={index === currentStep ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStepAction(step)}
                  >
                    {step.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {completedSteps === steps.length && (
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl">🎉</div>
            <div>
              <h3 className="font-semibold text-lg">Setup Complete!</h3>
              <p className="text-muted-foreground">
                You're all set to start creating amazing content with OmniPost.
              </p>
            </div>
            <Button onClick={() => router.push('/composer')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
