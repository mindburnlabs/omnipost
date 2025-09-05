
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Image, 
  Video, 
  File, 
  Search, 
  Filter,
  Trash2,
  Copy,
  Eye,
  Download,
  Plus
} from "lucide-react";
import { contentAssetsApi } from "@/lib/omnipost-api";
import { ContentAsset } from "@/types/omnipost";
import { toast } from "sonner";
import NextImage from "next/image";

export function AssetManager() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    alt_text: "",
    description: ""
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await contentAssetsApi.getAll();
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      // Mock assets for demo
      setAssets([
        {
          id: 1,
          user_id: 1,
          filename: "product-banner.jpg",
          original_filename: "product-banner.jpg",
          file_type: "image/jpeg",
          file_size: 245760,
          file_url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
          thumbnail_url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop",
          alt_text: "Product banner showing new features",
          usage_count: 5,
          metadata: { tags: ['product', 'banner'], uploaded_by: 'user' },
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          user_id: 1,
          filename: "team-photo.png",
          original_filename: "team-photo.png",
          file_type: "image/png",
          file_size: 512000,
          file_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
          thumbnail_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=150&fit=crop",
          alt_text: "Team collaboration photo",
          usage_count: 2,
          metadata: { tags: ['team', 'collaboration'], uploaded_by: 'user' },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.alt_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || 
                       (selectedType === 'images' && asset.file_type.startsWith('image/')) ||
                       (selectedType === 'videos' && asset.file_type.startsWith('video/')) ||
                       (selectedType === 'documents' && !asset.file_type.startsWith('image/') && !asset.file_type.startsWith('video/'));
    
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const asset = await contentAssetsApi.upload(file, uploadMetadata);
      setAssets(prev => [asset, ...prev]);
      setUploadMetadata({ alt_text: "", description: "" });
      setShowUploadDialog(false);
      toast.success("Asset uploaded successfully!");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to upload asset");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    try {
      await contentAssetsApi.delete(assetId);
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast.success("Asset deleted successfully");
    } catch (error: any) {
      toast.error(error.errorMessage || "Failed to delete asset");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    return File;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
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
            <Upload className="h-5 w-5" />
            Asset Manager
            <Badge variant="secondary">
              {assets.length} assets
            </Badge>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-file">File</Label>
                  <Input
                    id="asset-file"
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alt-text">Alt Text (for images)</Label>
                  <Input
                    id="alt-text"
                    placeholder="Describe the image for accessibility"
                    value={uploadMetadata.alt_text}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, alt_text: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional notes about this asset"
                    value={uploadMetadata.description}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            className="px-3 py-2 border rounded-md"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="documents">Documents</option>
          </select>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">
              {searchTerm ? 'No assets match your search' : 'No assets uploaded yet'}
            </p>
            <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Asset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAssets.map((asset) => {
              const FileIcon = getFileIcon(asset.file_type);
              
              return (
                <Card key={asset.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="aspect-square mb-3 relative overflow-hidden rounded-lg bg-muted">
                      {asset.file_type.startsWith('image/') ? (
                        <NextImage
                          src={asset.thumbnail_url || asset.file_url}
                          alt={asset.alt_text || asset.filename}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(asset.file_url, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopyUrl(asset.file_url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-medium truncate" title={asset.filename}>
                        {asset.filename}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {(asset.file_type.split('/')[1] || asset.file_type).toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(asset.file_size)}
                        </span>
                      </div>
                      {asset.usage_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Used {asset.usage_count} times
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
