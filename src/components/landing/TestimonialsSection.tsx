"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Alex Chen",
      role: "Community Manager",
      company: "GameDev Studios",
      content: "OmniPost transformed our social media strategy. We went from manually posting on each platform to having everything automated with perfect timing. Our engagement increased by 240% in just 3 months.",
      rating: 5,
      platform: "Discord",
      avatar: "AC"
    },
    {
      name: "Sarah Rodriguez",
      role: "Content Creator",
      company: "Tech Tutorials",
      content: "The AI-powered content optimization is incredible. It suggests better hashtags and timing than I ever could manually. My Telegram channel grew from 2K to 15K subscribers thanks to OmniPost's insights.",
      rating: 5,
      platform: "Telegram",
      avatar: "SR"
    },
    {
      name: "Mike Thompson",
      role: "Product Manager",
      company: "Whop Marketplace",
      content: "As a Whop creator, I needed something that understood our ecosystem. OmniPost's native Whop integration is flawless - it handles everything from post formatting to audience targeting perfectly.",
      rating: 5,
      platform: "Whop",
      avatar: "MT"
    },
    {
      name: "Elena Vasquez",
      role: "Marketing Director",
      company: "Creator Collective",
      content: "The A/B testing feature paid for itself in the first month. We discovered our audience prefers posts at 3 PM instead of 9 AM, which boosted our engagement by 180%. Data-driven content creation at its finest.",
      rating: 5,
      platform: "All Platforms",
      avatar: "EV"
    },
    {
      name: "David Kim",
      role: "Community Lead",
      company: "NFT Project",
      content: "Managing 5 Discord servers and 3 Telegram channels was a nightmare. OmniPost's automation engine handles everything while I sleep. Our community engagement is at an all-time high.",
      rating: 5,
      platform: "Discord + Telegram",
      avatar: "DK"
    },
    {
      name: "Jessica Wong",
      role: "Social Media Manager",
      company: "E-learning Platform",
      content: "The team collaboration features are outstanding. Our approval workflow ensures quality while the analytics help us optimize. We've saved 20+ hours per week and doubled our reach.",
      rating: 5,
      platform: "Multi-Platform",
      avatar: "JW"
    }
  ];

  const getPlatformIcon = (platform: string) => {
    if (platform.includes("Discord")) return "🎮";
    if (platform.includes("Telegram")) return "✈️";
    if (platform.includes("Whop")) return "🛍️";
    return "🌟";
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Star className="h-3 w-3 mr-1" />
            Customer Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by creators worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how OmniPost helps creators, communities, and businesses 
            amplify their reach and save countless hours every week.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative border-2 hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Quote Icon */}
                  <div className="flex items-start justify-between">
                    <Quote className="h-8 w-8 text-muted-foreground/20" />
                    <div className="flex items-center gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                    <div className="text-xl">
                      {getPlatformIcon(testimonial.platform)}
                    </div>
                  </div>
                  
                  {/* Platform Badge */}
                  <Badge variant="secondary" className="text-xs w-fit">
                    {testimonial.platform}
                  </Badge>
                </div>
              </CardContent>
              
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
            </Card>
          ))}
        </div>
        
        {/* Trust indicators */}
        <div className="text-center mt-12 pt-8 border-t">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <span className="font-semibold">5.0 average rating</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span>500+ verified reviews</span>
            <div className="h-4 w-px bg-border" />
            <span>99.9% uptime guarantee</span>
          </div>
        </div>
      </div>
    </section>
  );
}
