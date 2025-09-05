"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Globe, 
  Zap, 
  Users, 
  Shield,
  Webhook,
  BarChart3,
  Crown,
  Building
} from "lucide-react";
import Link from "next/link";

export function DeploymentOptions() {
  const deploymentOptions = [
    {
      title: "Standalone SaaS",
      subtitle: "Independent Platform",
      icon: <Globe className="h-8 w-8" />,
      description: "Deploy OmniPost as your own independent social media management platform with full control and customization.",
      price: "Self-Hosted",
      priceDescription: "One-time setup",
      gradient: "from-blue-500 to-cyan-500",
      features: [
        "Complete platform ownership",
        "Custom domain and branding",
        "Unlimited users and workspaces",
        "Full API access and customization",
        "Enterprise-grade security",
        "Priority support and updates",
        "White-label ready",
        "Custom integrations"
      ],
      highlights: [
        { icon: <Crown className="h-4 w-4" />, text: "Full Control" },
        { icon: <Shield className="h-4 w-4" />, text: "Enterprise Security" },
        { icon: <Webhook className="h-4 w-4" />, text: "API Access" }
      ],
      cta: "Deploy Standalone",
      ctaVariant: "default" as const,
      popular: false
    },
    {
      title: "Whop Embedded",
      subtitle: "Native Integration",
      icon: <Building className="h-8 w-8" />,
      description: "Run OmniPost as a native Whop application with seamless integration into the Whop ecosystem and built-in monetization.",
      price: "Whop Native",
      priceDescription: "Revenue sharing",
      gradient: "from-purple-500 to-pink-500",
      features: [
        "Native Whop marketplace presence",
        "Built-in subscription management",
        "Whop user authentication",
        "Automatic revenue sharing",
        "Community integration",
        "Whop support included",
        "Instant deployment",
        "Zero maintenance"
      ],
      highlights: [
        { icon: <Zap className="h-4 w-4" />, text: "Instant Setup" },
        { icon: <Users className="h-4 w-4" />, text: "Built-in Users" },
        { icon: <BarChart3 className="h-4 w-4" />, text: "Auto Revenue" }
      ],
      cta: "Launch on Whop",
      ctaVariant: "default" as const,
      popular: true
    }
  ];

  const sharedFeatures = [
    "All platform integrations (Discord, Telegram, Whop)",
    "AI-powered content optimization",
    "Advanced scheduling and analytics",
    "A/B testing capabilities",
    "Team collaboration tools",
    "Quality guardrails and automation",
    "Content library and templates",
    "Multi-timezone support"
  ];

  return (
    <div className="space-y-12">
      {/* Deployment Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {deploymentOptions.map((option, index) => (
          <Card 
            key={index} 
            className={`relative border-2 hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden ${
              option.popular ? 'border-purple-300 dark:border-purple-600' : ''
            }`}
          >
            {/* Popular Badge */}
            {option.popular && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-6">
              <div className="space-y-4">
                {/* Icon and Title */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{option.title}</CardTitle>
                    <p className="text-muted-foreground">{option.subtitle}</p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2">
                  {option.highlights.map((highlight, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {highlight.icon}
                      <span className="ml-1">{highlight.text}</span>
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>

                {/* Price */}
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{option.price}</div>
                  <div className="text-sm text-muted-foreground">{option.priceDescription}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold">What's included:</h4>
                <ul className="space-y-2">
                  {option.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Button 
                className={`w-full ${option.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                size="lg"
                asChild
              >
                <Link href="/login">
                  {option.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>

            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
          </Card>
        ))}
      </div>

      {/* Shared Features */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-center">
            🎯 Both deployments include all core features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">
          Need help choosing the right deployment?
        </h3>
        <p className="text-muted-foreground">
          Our team can help you determine the best option for your needs
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" size="lg">
            Compare Features
          </Button>
          <Button variant="outline" size="lg">
            Schedule Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}
