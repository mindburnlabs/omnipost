"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Calendar, 
  BarChart3, 
  Shield, 
  Bot,
  Target,
  Clock,
  TrendingUp,
  Users,
  Sparkles,
  TestTube2,
  FileText,
  Webhook,
  Globe
} from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      icon: <Bot className="h-8 w-8" />,
      title: "AI-Powered Enhancement",
      description: "Smart content optimization, hashtag suggestions, and engagement prediction powered by advanced AI.",
      badge: "🤖 AI",
      color: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Smart Scheduling",
      description: "AI-powered best time recommendations with timezone awareness and automated posting.",
      badge: "⏰ Schedule",
      color: "from-green-500 to-teal-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: <TestTube2 className="h-8 w-8" />,
      title: "A/B Testing",
      description: "Built-in experimentation with clear winner detection and performance analytics.",
      badge: "🧪 Testing",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Comprehensive metrics, timing heatmaps, and performance insights across all platforms.",
      badge: "📊 Analytics",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Multi-Platform Publishing",
      description: "Discord, Telegram, and Whop integration with platform-specific optimizations.",
      badge: "🎯 Platforms",
      color: "from-indigo-500 to-blue-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Guardrails",
      description: "Link validation, duplicate detection, content safety checks, and spam prevention.",
      badge: "🛡️ Security",
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Approval workflows, role-based access control, and team activity tracking.",
      badge: "👥 Teams",
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Content Library",
      description: "Templates, snippets, asset management with version history and organization.",
      badge: "📁 Library",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Automation Engine",
      description: "Rule-based workflows with dry-run testing and conditional logic automation.",
      badge: "⚡ Automation",
      color: "from-yellow-500 to-amber-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
    },
    {
      icon: <Webhook className="h-8 w-8" />,
      title: "Developer API",
      description: "Full REST API with webhooks, integrations, and custom workflow support.",
      badge: "🔌 API",
      color: "from-slate-500 to-gray-600",
      bgColor: "bg-slate-50 dark:bg-slate-950/20"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Performance Optimization",
      description: "Real-time engagement tracking and content performance optimization suggestions.",
      badge: "📈 Growth",
      color: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/20"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Deployment",
      description: "Standalone SaaS or Whop-embedded deployment with enterprise-grade scaling.",
      badge: "🌍 Deploy",
      color: "from-teal-500 to-cyan-600",
      bgColor: "bg-teal-50 dark:bg-teal-950/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <Card 
          key={index} 
          className={`relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:scale-105 group ${feature.bgColor}`}
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Icon and Badge */}
              <div className="flex items-start justify-between">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {feature.badge}
                </Badge>
              </div>
              
              {/* Title and Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              {/* Hover Effect Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
