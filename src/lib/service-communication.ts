// ===========================================
// INTER-SERVICE COMMUNICATION LAYER
// ===========================================

import jwt from 'jsonwebtoken';

interface ServiceConfig {
  name: string;
  baseUrl: string;
  healthPath: string;
  timeout: number;
}

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  service: string;
  responseTime: number;
}

export class ServiceCommunicator {
  private services: Record<string, ServiceConfig> = {};
  private serviceToken: string;

  constructor() {
    // Service-to-service JWT token for internal communication
    this.serviceToken = jwt.sign(
      { 
        iss: 'omnipost-services',
        sub: 'internal-service',
        scope: 'service-to-service'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Initialize service configurations from environment
    this.initializeServices();
  }

  private initializeServices() {
    this.services = {
      web: {
        name: 'omnipost-web',
        baseUrl: process.env.WEB_SERVICE_URL || 'http://omnipost:3000',
        healthPath: '/api/health',
        timeout: 30000
      },
      worker: {
        name: 'omnipost-worker', 
        baseUrl: process.env.WORKER_SERVICE_URL || 'http://omnipost-worker:3001',
        healthPath: '/health',
        timeout: 60000
      },
      ai: {
        name: 'omnipost-ai',
        baseUrl: process.env.AI_SERVICE_URL || 'http://omnipost-ai:3002', 
        healthPath: '/health',
        timeout: 120000 // AI operations can take longer
      }
    };
  }

  private async makeServiceCall<T>(
    serviceName: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    const service = this.services[serviceName];
    
    if (!service) {
      return {
        success: false,
        error: `Service ${serviceName} not configured`,
        service: serviceName,
        responseTime: Date.now() - startTime
      };
    }

    try {
      const url = `${service.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
          'X-Service-Name': process.env.SERVICE_NAME || 'omnipost-web',
          ...options.headers
        },
        signal: AbortSignal.timeout(service.timeout)
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${data}`,
          service: serviceName,
          responseTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        data,
        service: serviceName,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Service call to ${serviceName}${endpoint} failed:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        service: serviceName,
        responseTime: Date.now() - startTime
      };
    }
  }

  // ============= WORKER SERVICE COMMUNICATION =============

  async publishPost(postId: number): Promise<ServiceResponse<{ jobId: string }>> {
    return this.makeServiceCall('worker', '/api/publish', {
      method: 'POST',
      body: JSON.stringify({ postId })
    });
  }

  async schedulePost(postId: number, scheduledAt: string): Promise<ServiceResponse<{ jobId: string }>> {
    return this.makeServiceCall('worker', '/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ postId, scheduledAt })
    });
  }

  async retryFailedPost(postId: number): Promise<ServiceResponse<{ jobId: string }>> {
    return this.makeServiceCall('worker', '/api/retry', {
      method: 'POST',
      body: JSON.stringify({ postId })
    });
  }

  async getPublishingStats(): Promise<ServiceResponse<any>> {
    return this.makeServiceCall('worker', '/api/stats', {
      method: 'GET'
    });
  }

  async triggerAutomationRule(ruleId: number): Promise<ServiceResponse<any>> {
    return this.makeServiceCall('worker', '/api/automation/trigger', {
      method: 'POST',
      body: JSON.stringify({ ruleId })
    });
  }

  async dryRunAutomationRule(ruleId: number): Promise<ServiceResponse<any>> {
    return this.makeServiceCall('worker', '/api/automation/dry-run', {
      method: 'POST',
      body: JSON.stringify({ ruleId })
    });
  }

  // ============= AI SERVICE COMMUNICATION =============

  async generateContent(request: {
    prompt: string;
    alias?: string;
    capability?: string;
    userId?: number;
    workspaceId?: number;
    options?: Record<string, any>;
  }): Promise<ServiceResponse<any>> {
    return this.makeServiceCall('ai', '/api/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async optimizeForPlatform(content: string, platform: string, userId?: number): Promise<ServiceResponse<{ optimizedContent: string }>> {
    return this.makeServiceCall('ai', '/api/optimize', {
      method: 'POST',
      body: JSON.stringify({ content, platform, userId })
    });
  }

  async generateHashtags(content: string, count: number = 5, userId?: number): Promise<ServiceResponse<{ hashtags: string[] }>> {
    return this.makeServiceCall('ai', '/api/hashtags', {
      method: 'POST',
      body: JSON.stringify({ content, count, userId })
    });
  }

  async generateContentIdeas(topic: string, platform?: string, count: number = 5, userId?: number): Promise<ServiceResponse<{ ideas: string[] }>> {
    return this.makeServiceCall('ai', '/api/ideas', {
      method: 'POST',
      body: JSON.stringify({ topic, platform, count, userId })
    });
  }

  async analyzeImage(imageBase64: string, prompt?: string, userId?: number): Promise<ServiceResponse<{ analysis: string }>> {
    return this.makeServiceCall('ai', '/api/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64, prompt, userId })
    });
  }

  async generateABVariants(content: string, count: number = 2, userId?: number): Promise<ServiceResponse<{ variants: string[] }>> {
    return this.makeServiceCall('ai', '/api/ab-variants', {
      method: 'POST',
      body: JSON.stringify({ content, count, userId })
    });
  }

  async getAIUsage(userId: number, startDate?: string, endDate?: string): Promise<ServiceResponse<any>> {
    const params = new URLSearchParams();
    params.append('userId', userId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return this.makeServiceCall('ai', `/api/usage?${params.toString()}`, {
      method: 'GET'
    });
  }

  // ============= HEALTH CHECKS =============

  async checkServiceHealth(serviceName: string): Promise<ServiceResponse<any>> {
    const service = this.services[serviceName];
    if (!service) {
      return {
        success: false,
        error: `Service ${serviceName} not configured`,
        service: serviceName,
        responseTime: 0
      };
    }

    return this.makeServiceCall(serviceName, service.healthPath, {
      method: 'GET'
    });
  }

  async checkAllServicesHealth(): Promise<Record<string, ServiceResponse<any>>> {
    const results: Record<string, ServiceResponse<any>> = {};
    
    const healthChecks = Object.keys(this.services).map(async (serviceName) => {
      results[serviceName] = await this.checkServiceHealth(serviceName);
    });

    await Promise.all(healthChecks);
    return results;
  }

  // ============= UTILITY METHODS =============

  isServiceHealthy(serviceName: string, healthResult?: ServiceResponse<any>): boolean {
    if (!healthResult) return false;
    return healthResult.success && healthResult.responseTime < this.services[serviceName]?.timeout;
  }

  getServiceUrl(serviceName: string): string | null {
    return this.services[serviceName]?.baseUrl || null;
  }

  // Graceful degradation helper
  async callWithFallback<T>(
    primaryCall: () => Promise<ServiceResponse<T>>,
    fallbackCall?: () => Promise<T>
  ): Promise<T> {
    const result = await primaryCall();
    
    if (result.success) {
      return result.data!;
    }

    if (fallbackCall) {
      console.warn(`Service call failed, using fallback. Error: ${result.error}`);
      return await fallbackCall();
    }

    throw new Error(`Service call failed and no fallback available: ${result.error}`);
  }
}

// Global service communicator instance
let serviceCommunicator: ServiceCommunicator | null = null;

export function getServiceCommunicator(): ServiceCommunicator {
  if (!serviceCommunicator) {
    serviceCommunicator = new ServiceCommunicator();
  }
  return serviceCommunicator;
}

// Middleware for verifying service-to-service requests
export function verifyServiceToken(request: Request): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    return decoded.scope === 'service-to-service' && decoded.iss === 'omnipost-services';
  } catch {
    return false;
  }
}
