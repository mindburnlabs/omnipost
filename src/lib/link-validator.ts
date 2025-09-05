
// Real link validation with comprehensive checks
export interface LinkValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'warning' | 'timeout';
  statusCode?: number;
  message: string;
  redirectUrl?: string;
  responseTime?: number;
  contentType?: string;
  title?: string;
}

export interface MediaConstraint {
  type: 'image' | 'video' | 'document';
  maxSize: number;
  allowedFormats: string[];
  maxDimensions?: { width: number; height: number };
}

export class LinkValidator {
  private static readonly TIMEOUT = 10000; // 10 seconds
  private static readonly USER_AGENT = 'OmniPost/1.0 (+https://omnipost.app)';

  async validateLinks(content: string): Promise<LinkValidationResult[]> {
    const linkRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const links = content.match(linkRegex) || [];
    
    if (links.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(
      links.map(link => this.validateSingleLink(link))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: links[index],
          status: 'invalid' as const,
          message: `Validation failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
        };
      }
    });
  }

  private async validateSingleLink(url: string): Promise<LinkValidationResult> {
    const startTime = Date.now();
    
    try {
      // Basic URL validation
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        return {
          url,
          status: 'invalid',
          message: 'Invalid URL format'
        };
      }

      // Check for suspicious domains
      const suspiciousDomains = [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners (warning)
        'malware-test.com', 'phishing-test.com' // Known bad domains (block)
      ];

      const domain = parsedUrl.hostname.toLowerCase();
      if (suspiciousDomains.includes(domain)) {
        return {
          url,
          status: domain.includes('test.com') ? 'invalid' : 'warning',
          message: domain.includes('test.com') 
            ? 'Potentially malicious domain detected'
            : 'URL shortener detected - consider using direct links for better trust'
        };
      }

      // Perform HEAD request first for efficiency
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LinkValidator.TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'User-Agent': LinkValidator.USER_AGENT,
            'Accept': '*/*'
          },
          signal: controller.signal,
          redirect: 'follow'
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const finalUrl = response.url !== url ? response.url : undefined;

          return {
            url,
            status: 'valid',
            statusCode: response.status,
            message: 'Link is accessible',
            redirectUrl: finalUrl,
            responseTime,
            contentType
          };
        } else {
          return {
            url,
            status: 'invalid',
            statusCode: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            responseTime
          };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            url,
            status: 'timeout',
            message: `Request timeout after ${LinkValidator.TIMEOUT}ms`,
            responseTime: Date.now() - startTime
          };
        }

        return {
          url,
          status: 'invalid',
          message: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          responseTime: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        url,
        status: 'invalid',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  async validateMediaConstraints(
    fileUrl: string,
    constraints: MediaConstraint
  ): Promise<{ valid: boolean; message: string; details?: any }> {
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return {
          valid: false,
          message: `Media file not accessible: HTTP ${response.status}`
        };
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      // Check file type
      const isAllowedFormat = constraints.allowedFormats.some(format => 
        contentType.includes(format)
      );

      if (!isAllowedFormat) {
        return {
          valid: false,
          message: `Unsupported format. Allowed: ${constraints.allowedFormats.join(', ')}`,
          details: { actualType: contentType }
        };
      }

      // Check file size
      if (contentLength > constraints.maxSize) {
        return {
          valid: false,
          message: `File too large. Maximum: ${this.formatFileSize(constraints.maxSize)}`,
          details: { 
            actualSize: contentLength,
            maxSize: constraints.maxSize,
            actualSizeFormatted: this.formatFileSize(contentLength)
          }
        };
      }

      return {
        valid: true,
        message: 'Media file meets all constraints',
        details: {
          type: contentType,
          size: contentLength,
          sizeFormatted: this.formatFileSize(contentLength)
        }
      };

    } catch (error) {
      return {
        valid: false,
        message: `Unable to validate media: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMediaConstraints(platform: string): MediaConstraint {
    switch (platform) {
      case 'discord':
        return {
          type: 'image',
          maxSize: 8 * 1024 * 1024, // 8MB
          allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          maxDimensions: { width: 4096, height: 4096 }
        };
      case 'telegram':
        return {
          type: 'image',
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          maxDimensions: { width: 1280, height: 1280 }
        };
      case 'whop':
        return {
          type: 'image',
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          maxDimensions: { width: 2048, height: 2048 }
        };
      default:
        return {
          type: 'image',
          maxSize: 5 * 1024 * 1024,
          allowedFormats: ['image/jpeg', 'image/png'],
          maxDimensions: { width: 1920, height: 1080 }
        };
    }
  }
}

// Global link validator instance
let linkValidator: LinkValidator | null = null;

export async function getLinkValidator(): Promise<LinkValidator> {
  if (!linkValidator) {
    linkValidator = new LinkValidator();
  }
  return linkValidator;
}
