"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Zap, 
  Calendar, 
  BarChart3, 
  Shield, 
  Sparkles,
  Users,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  Play,
  Star
} from "lucide-react";
import Link from "next/link";
import { PlatformShowcase } from "./PlatformShowcase";
import { FeatureGrid } from "./FeatureGrid";
import { TestimonialsSection } from "./TestimonialsSection";
import { DeploymentOptions } from "./DeploymentOptions";
import { StatsSection } from "./StatsSection";
import { useTypewriter } from "@/hooks/useTypewriter";

export function LandingPage() {
  const [activePlatform, setActivePlatform] = useState<'discord' | 'telegram' | 'whop'>('discord');
  const typewriterText = useTypewriter(["Management", "Automation", "Growth", "Success"], 150, 100, 2000);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OP</span>
              </div>
              <span className="font-bold text-xl">OmniPost</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
              </a>
              <a 
                href="#platforms" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Platforms
              </a>
              <a 
                href="#pricing" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Pricing
              </a>
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
            <div className="md:hidden">
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Write once. Publish everywhere.
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Social Media
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {typewriterText}
                <span className="animate-pulse">|</span>
              </span>
              <br />
              Reimagined
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Compose, schedule, and analyze your content across Discord, Telegram, and Whop. 
              Powered by AI and built for creators who demand excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/login">
                  Start Creating Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by creators worldwide
              </p>
              <div className="flex items-center justify-center gap-8 opacity-60">
                <span className="text-2xl">🎮</span>
                <span className="text-2xl">✈️</span>
                <span className="text-2xl">🛍️</span>
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Platform Showcase */}
      <section id="platforms" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              Multi-Platform Publishing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              One post, three platforms
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how your content looks across Discord, Telegram, and Whop 
              with real-time previews and platform-specific optimizations.
            </p>
          </div>
          
          <PlatformShowcase 
            activePlatform={activePlatform}
            onPlatformChange={setActivePlatform}
          />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI-powered content optimization to advanced analytics, 
              OmniPost gives you the tools to grow your audience.
            </p>
          </div>
          
          <FeatureGrid />
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Deployment Options */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Flexible Deployment
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Deploy your way
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose between standalone SaaS deployment or native Whop integration. 
              Both options include full feature access and premium support.
            </p>
          </div>
          
          <DeploymentOptions />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to transform your 
              <br />
              social media strategy?
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Join thousands of creators who trust OmniPost to amplify their reach, 
              save time, and drive real results across all platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/login">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Schedule Demo Call
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Setup in 5 minutes
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">OP</span>
                </div>
                <span className="font-bold">OmniPost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Write once. Publish everywhere.
                <br />
                The social media management platform for modern creators.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <span className="text-sm text-muted-foreground">5.0 rating</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a 
                    href="#features" 
                    className="hover:text-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a 
                    href="#platforms" 
                    className="hover:text-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Platforms
                  </a>
                </li>
                <li>
                  <a 
                    href="#pricing" 
                    className="hover:text-foreground transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Pricing
                  </a>
                </li>
                <li><a href="/login" className="hover:text-foreground transition-colors">Sign In</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status Page</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 OmniPost. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
