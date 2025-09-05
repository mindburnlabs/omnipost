
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";
import CrudOperations from '@/lib/crud-operations';
import { NextRequest } from 'next/server';

// POST request - upload content asset
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;
    
    if (!file) {
      return createErrorResponse({
        errorMessage: "File is required",
        status: 400,
      });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse({
        errorMessage: "Unsupported file type",
        status: 400,
      });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return createErrorResponse({
        errorMessage: "File size exceeds 10MB limit",
        status: 400,
      });
    }

    const assetsCrud = new CrudOperations("content_assets", context.token);
    const user_id = context.payload?.sub;
    
    // In a real implementation, you'd upload to cloud storage
    // For demo, we'll create a mock URL
    const filename = `${Date.now()}_${file.name}`;
    const fileUrl = `https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop`;
    const thumbnailUrl = `https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop`;

    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (error) {
        console.warn('Failed to parse metadata:', error);
      }
    }

    const assetData = {
      user_id,
      filename,
      original_filename: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: fileUrl,
      thumbnail_url: file.type.startsWith('image/') ? thumbnailUrl : undefined,
      alt_text: (metadata as any)?.alt_text || '',
      usage_count: 0,
      metadata: {
        ...metadata,
        upload_timestamp: new Date().toISOString(),
        original_dimensions: file.type.startsWith('image/') ? { width: 800, height: 600 } : undefined
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const asset = await assetsCrud.create(assetData);
    return createSuccessResponse(asset, 201);
  } catch (error) {
    console.error('Failed to upload asset:', error);
    return createErrorResponse({
      errorMessage: "Failed to upload asset",
      status: 500,
    });
  }
}, true);
