
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Palette, 
  Plus, 
  Edit, 
  Trash2,
  Copy,
  Eye,
  Hash,
  Type,
  Link
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface BrandKit {
  id: number;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  fonts: Record<string, any>;
  tone_guidelines?: string;
  banned_words: string[];
  utm_templates: Record<string, any>;
  created_at: string;
}

export function BrandKitManager() {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBrandKit, setNewBrandKit] = useState({
    name: "",
    primary_color: "#2563eb",
    secondary_color: "#64748b",
    logo_url: "",
    tone_guidelines: "",
    banned_words: "",
    utm_template: ""
  });

  useEffect(() => {
    fetchBrandKits();
  }, []);

  const fetchBrandKits = async () => {
    try {
      const data = await api.get('/brand-kits');
      setBrandKits(data);
    } catch (error) {
      console.error('Failed to fetch brand kits:', error);
      // Mock data for demo
      setBrandKits([
        {
          id: 1,
          name: "Primary Brand",
          primary_color: "#2563eb",
          secondary_color: "#64748b",
          logo_url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop",
          fonts: { primary: "Inter", secondary: "Roboto" },
          tone_guidelines: "Professional yet approachable. Use active voice and clear, concise language.",
          banned_words: ["spam", "cheap", "urgent"],
          utm_templates: {
            campaign: "omnipost_{{platform}}_{{date}}",
            source: "{{platform}}",
            medium: "social"
          },
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrandKit = async () => {
    if (!newBrandKit.name.trim()) {
      toast.error("Brand kit name is required");
      return;
    }

    try {
      const brandKitData = {
        ...newBrandKit,
        banned_words: newBrandKit.banned_words.split(',').map(w => w.trim()).filter(Boolean),
        utm_templates: newBrandKit.utm_template ? {
          default: newBrandKit.utm_template
        } : {},
        fonts: { primary: "Inter", secondary: "Roboto" }
      };

      const brandKit = await api.post('/brand-kits', brandKitData);
      setBrandKits(prev => [brandKit, ...prev]);
      setNewBrandKit({
        name: "",
        primary_color: "#2563eb",
        secondary_color: "#64748b",
        logo_url: "",
        tone_guidelines: "",
        banned_words: "",
        utm_template: ""
      });
      setShowCreateDialog(false);
      toast.success("Brand kit created successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to create brand kit");
    }
  };

  const handleDeleteBrandKit = async (brandKitId: number) => {
    try {
      await api.delete(`/brand-kits/${brandKitId}`);
      setBrandKits(prev => prev.filter(kit => kit.id !== brandKitId));
      toast.success("Brand kit deleted successfully");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to delete brand kit");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Kit Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
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
            <Palette className="h-5 w-5" />
            Brand Kits
            <Badge variant="secondary">
              {brandKits.length} kits
            </Badge>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Kit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Brand Kit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kit-name">Brand Kit Name</Label>
                    <Input
                      id="kit-name"
                      placeholder="e.g., Primary Brand"
                      value={newBrandKit.name}
                      onChange={(e) => setNewBrandKit(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">Logo URL (Optional)</Label>
                    <Input
                      id="logo-url"
                      placeholder="https://..."
                      value={newBrandKit.logo_url}
                      onChange={(e) => setNewBrandKit(prev => ({ ...prev, logo_url: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={newBrandKit.primary_color}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-16"
                      />
                      <Input
                        value={newBrandKit.primary_color}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={newBrandKit.secondary_color}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="w-16"
                      />
                      <Input
                        value={newBrandKit.secondary_color}
                        onChange={(e) => setNewBrandKit(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone-guidelines">Tone Guidelines</Label>
                  <Textarea
                    id="tone-guidelines"
                    placeholder="Describe your brand's voice and tone..."
                    value={newBrandKit.tone_guidelines}
                    onChange={(e) => setNewBrandKit(prev => ({ ...prev, tone_guidelines: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banned-words">Banned Words (comma-separated)</Label>
                  <Input
                    id="banned-words"
                    placeholder="spam, cheap, urgent"
                    value={newBrandKit.banned_words}
                    onChange={(e) => setNewBrandKit(prev => ({ ...prev, banned_words: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utm-template">UTM Template (Optional)</Label>
                  <Input
                    id="utm-template"
                    placeholder="campaign_{{platform}}_{{date}}"
                    value={newBrandKit.utm_template}
                    onChange={(e) => setNewBrandKit(prev => ({ ...prev, utm_template: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBrandKit}>
                    Create Brand Kit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {brandKits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No brand kits created yet</p>
            <p className="text-sm mb-4">Create brand kits to maintain consistent messaging</p>
            <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Brand Kit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {brandKits.map((kit) => (
              <Card key={kit.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Color Preview */}
                      <div className="flex gap-2">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: kit.primary_color }}
                          title={`Primary: ${kit.primary_color}`}
                        />
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: kit.secondary_color }}
                          title={`Secondary: ${kit.secondary_color}`}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{kit.name}</h3>
                          {kit.logo_url && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Logo
                            </Badge>
                          )}
                        </div>
                        
                        {kit.tone_guidelines && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {kit.tone_guidelines}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {kit.banned_words.length} banned words
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Type className="h-3 w-3 mr-1" />
                            {Object.keys(kit.fonts).length} fonts
                          </Badge>
                          {Object.keys(kit.utm_templates).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Link className="h-3 w-3 mr-1" />
                              UTM templates
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBrandKit(kit.id)}
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
