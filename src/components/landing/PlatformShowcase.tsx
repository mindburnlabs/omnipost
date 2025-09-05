"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageSquare, Share, Eye, MoreHorizontal } from "lucide-react";

interface PlatformShowcaseProps {
  activePlatform: 'discord' | 'telegram' | 'whop';
  onPlatformChange: (platform: 'discord' | 'telegram' | 'whop') => void;
}

export function PlatformShowcase({ activePlatform, onPlatformChange }: PlatformShowcaseProps) {
  const sampleContent = {
    title: "🚀 New Feature Launch!",
    content: `We're excited to announce our new AI-powered content optimization feature! 

✨ What's new:
• Smart hashtag suggestions
• Engagement time prediction
• Auto content enhancement

This will help you create better content and reach more audience across all platforms. Try it now!

#ContentCreation #AI #SocialMedia #Innovation`,
    tags: ["ContentCreation", "AI", "SocialMedia", "Innovation"]
  };

  const renderDiscordPreview = () => (
    <div className="bg-[#36393f] text-white p-6 rounded-lg font-mono text-sm max-w-md mx-auto">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
          OP
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">OmniPost Bot</span>
            <Badge variant="secondary" className="text-xs">BOT</Badge>
            <span className="text-xs text-gray-400">Today at 2:30 PM</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="font-bold text-lg">{sampleContent.title}</div>
        <div className="whitespace-pre-line text-gray-100 leading-relaxed">
          {sampleContent.content}
        </div>
        
        <div className="flex items-center gap-6 mt-4 text-gray-400 text-xs">
          <div className="flex items-center gap-1 hover:text-red-400 cursor-pointer transition-colors">
            <Heart className="h-4 w-4" />
            <span>24</span>
          </div>
          <div className="flex items-center gap-1 hover:text-blue-400 cursor-pointer transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span>8</span>
          </div>
          <div className="flex items-center gap-1 hover:text-gray-300 cursor-pointer transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTelegramPreview = () => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 max-w-sm mx-auto shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          OP
        </div>
        <div className="flex-1">
          <div className="font-semibold text-blue-600 text-sm">OmniPost Channel</div>
          <div className="text-xs text-gray-500">2:30 PM</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="font-bold text-base text-gray-900">{sampleContent.title}</div>
        <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
          {sampleContent.content}
        </div>
        
        <div className="flex items-center justify-between mt-4 text-gray-400 text-xs">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>1.2K views</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400 cursor-pointer hover:scale-110 transition-transform" />
            <Share className="h-4 w-4 cursor-pointer hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderWhopPreview = () => (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 max-w-md mx-auto shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          OP
        </div>
        <div className="flex-1">
          <div className="font-semibold text-purple-700 text-sm">OmniPost Updates</div>
          <div className="text-xs text-purple-400">Community • Just now</div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
          Premium
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="font-bold text-lg text-purple-900">{sampleContent.title}</div>
        <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
          {sampleContent.content}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {sampleContent.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              #{tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4 text-purple-600 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 hover:text-red-500 cursor-pointer transition-colors">
              <Heart className="h-4 w-4" />
              <span>47</span>
            </div>
            <div className="flex items-center gap-1 hover:text-purple-700 cursor-pointer transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span>12</span>
            </div>
          </div>
          <div className="text-purple-500">
            <Share className="h-4 w-4 cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );

  const platforms = [
    { 
      id: 'discord' as const, 
      name: 'Discord', 
      icon: '🎮', 
      color: 'from-indigo-500 to-purple-600',
      description: 'Gaming communities & servers'
    },
    { 
      id: 'telegram' as const, 
      name: 'Telegram', 
      icon: '✈️', 
      color: 'from-blue-500 to-cyan-500',
      description: 'Channels & group chats'
    },
    { 
      id: 'whop' as const, 
      name: 'Whop', 
      icon: '🛍️', 
      color: 'from-purple-500 to-pink-500',
      description: 'Premium communities'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Platform Selector */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
          {platforms.map((platform) => (
            <Button
              key={platform.id}
              variant={activePlatform === platform.id ? "default" : "outline"}
              className={`h-auto p-6 flex flex-col items-center gap-3 transition-all duration-300 ${
                activePlatform === platform.id 
                  ? `bg-gradient-to-r ${platform.color} hover:shadow-lg scale-105` 
                  : 'hover:scale-105'
              }`}
              onClick={() => onPlatformChange(platform.id)}
            >
              <span className="text-3xl">{platform.icon}</span>
              <div className="text-center">
                <div className="font-semibold">{platform.name}</div>
                <div className={`text-xs ${activePlatform === platform.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {platform.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Platform Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card className="border-2 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Badge variant="outline" className="mb-2">
                  Live Preview
                </Badge>
                <h3 className="text-xl font-semibold">
                  How your post looks on {platforms.find(p => p.id === activePlatform)?.name}
                </h3>
              </div>
              
              <div className="transition-all duration-500 ease-in-out">
                {activePlatform === 'discord' && renderDiscordPreview()}
                {activePlatform === 'telegram' && renderTelegramPreview()}
                {activePlatform === 'whop' && renderWhopPreview()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-2">Real-time Preview</h4>
            <p className="text-sm text-muted-foreground">
              See exactly how your content appears on each platform before publishing.
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-2">Platform Optimization</h4>
            <p className="text-sm text-muted-foreground">
              Content automatically optimized for each platform's unique features and audience.
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold mb-2">One-Click Publishing</h4>
            <p className="text-sm text-muted-foreground">
              Publish to all platforms simultaneously or schedule for optimal engagement times.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
