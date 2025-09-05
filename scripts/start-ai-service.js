// ===========================================
// OMNIPOST AI SERVICE STARTUP
// ===========================================

const http = require('http');
const cluster = require('cluster');
const os = require('os');

// AI service modules
let aiService, aiProviderSystem;

async function initializeAIServices() {
  console.log('🤖 Initializing AI services...');
  
  try {
    // Import AI services
    const { getAIService } = require('../src/lib/ai-service');
    const { getAIProviderSystem } = require('../src/lib/ai-provider-system');
    
    // Initialize AI services
    aiService = await getAIService();
    aiProviderSystem = await getAIProviderSystem();
    
    console.log('✅ AI services initialized successfully');
    
    // Start AI service monitoring
    startAIMonitoring();
    
  } catch (error) {
    console.error('❌ Failed to initialize AI services:', error);
    process.exit(1);
  }
}

function startAIMonitoring() {
  // Monitor AI usage and performance every 10 minutes
  setInterval(async () => {
    try {
      // Log AI provider status and usage
      const providers = await aiProviderSystem.getProviderKeys(1, 1); // Default workspace
      const activeProviders = providers.filter(p => p.status === 'active').length;
      
      console.log(`🤖 AI Service Status - ${activeProviders} active providers`);
      
      // Log memory usage (AI operations can be memory intensive)
      const memoryUsage = process.memoryUsage();
      const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      console.log(`💾 Memory Usage: ${memoryMB}MB`);
      
    } catch (error) {
      console.error('AI monitoring error:', error);
    }
  }, 10 * 60 * 1000);
}

// ===========================================
// HTTP SERVER FOR AI API ENDPOINTS
// ===========================================

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Name');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Service authentication middleware (except health checks)
  const authHeader = req.headers.authorization;
  if (!url.pathname.startsWith('/health') && (!authHeader || !authHeader.startsWith('Bearer '))) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    // Health check endpoint
    if (url.pathname === '/health' && method === 'GET') {
      const providers = await aiProviderSystem.getProviderKeys(1, 1);
      const activeProviders = providers.filter(p => p.status === 'active');
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          aiService: aiService ? 'running' : 'stopped',
          aiProviderSystem: aiProviderSystem ? 'running' : 'stopped'
        },
        providers: {
          total: providers.length,
          active: activeProviders.length,
          providers: activeProviders.map(p => ({
            name: p.provider_name,
            status: p.status
          }))
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // Content generation endpoint
    if (url.pathname === '/api/generate' && method === 'POST') {
      const body = await readRequestBody(req);
      const request = JSON.parse(body);
      
      const result = await aiService.generateContent({
        prompt: request.prompt,
        alias: request.alias,
        capability: request.capability,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        userId: request.userId,
        workspaceId: request.workspaceId,
        image: request.image
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
      return;
    }

    // Platform optimization endpoint
    if (url.pathname === '/api/optimize' && method === 'POST') {
      const body = await readRequestBody(req);
      const { content, platform, userId, workspaceId } = JSON.parse(body);
      
      const optimizedContent = await aiService.optimizeForPlatform(
        content, 
        platform, 
        userId, 
        workspaceId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { optimizedContent } 
      }));
      return;
    }

    // Hashtag generation endpoint
    if (url.pathname === '/api/hashtags' && method === 'POST') {
      const body = await readRequestBody(req);
      const { content, count, userId, workspaceId } = JSON.parse(body);
      
      const hashtags = await aiService.generateHashtags(
        content, 
        count || 5, 
        userId, 
        workspaceId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { hashtags } 
      }));
      return;
    }

    // Content ideas generation endpoint
    if (url.pathname === '/api/ideas' && method === 'POST') {
      const body = await readRequestBody(req);
      const { topic, platform, count, userId, workspaceId } = JSON.parse(body);
      
      const ideas = await aiService.generateContentIdeas(
        topic, 
        platform, 
        count || 5, 
        userId, 
        workspaceId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { ideas } 
      }));
      return;
    }

    // Image analysis endpoint
    if (url.pathname === '/api/analyze-image' && method === 'POST') {
      const body = await readRequestBody(req);
      const { image, prompt, userId, workspaceId } = JSON.parse(body);
      
      const analysis = await aiService.analyzeImage(
        image, 
        prompt, 
        userId, 
        workspaceId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { analysis } 
      }));
      return;
    }

    // A/B testing variants endpoint
    if (url.pathname === '/api/ab-variants' && method === 'POST') {
      const body = await readRequestBody(req);
      const { content, count, userId, workspaceId } = JSON.parse(body);
      
      const variants = await aiService.generateABTestVariants(
        content, 
        count || 2, 
        userId, 
        workspaceId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { variants } 
      }));
      return;
    }

    // Content improvement endpoint
    if (url.pathname === '/api/improve' && method === 'POST') {
      const body = await readRequestBody(req);
      const { content, instructions, userId, workspaceId } = JSON.parse(body);
      
      const improvedContent = await aiService.improveContent(
        content, 
        instructions, 
        userId, 
        workspaceId
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { improvedContent } 
      }));
      return;
    }

    // AI usage statistics endpoint
    if (url.pathname === '/api/usage' && method === 'GET') {
      const userId = parseInt(url.searchParams.get('userId') || '1');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      
      // Get usage statistics from AI provider system
      const usage = await aiProviderSystem.getUsageStats(userId, 1, startDate, endDate);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: usage 
      }));
      return;
    }

    // Available models endpoint
    if (url.pathname === '/api/models' && method === 'GET') {
      const userId = parseInt(url.searchParams.get('userId') || '1');
      const workspaceId = parseInt(url.searchParams.get('workspaceId') || '1');
      
      const aliases = await aiService.getAvailableAliases(userId, workspaceId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { aliases } 
      }));
      return;
    }

    // Provider health check endpoint
    if (url.pathname === '/api/providers/health' && method === 'GET') {
      const userId = parseInt(url.searchParams.get('userId') || '1');
      const workspaceId = parseInt(url.searchParams.get('workspaceId') || '1');
      
      const providers = await aiProviderSystem.getProviderKeys(userId, workspaceId);
      const providerHealth = {};
      
      for (const provider of providers) {
        providerHealth[provider.provider_name] = {
          status: provider.status,
          last_used: provider.last_used_at,
          error: provider.validation_error
        };
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { providers: providerHealth } 
      }));
      return;
    }

    // 404 for unknown endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));

  } catch (error) {
    console.error('AI Service API error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
});

// Helper function to read request body
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// ===========================================
// CLUSTER MANAGEMENT FOR AI WORKLOADS
// ===========================================

function startWithClustering() {
  const numCPUs = os.cpus().length;
  const numWorkers = Math.min(numCPUs, 4); // Limit to 4 workers max for AI service
  
  if (cluster.isMaster) {
    console.log(`🤖 Master AI service process ${process.pid} starting...`);
    console.log(`🚀 Starting ${numWorkers} AI worker processes`);
    
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`🔄 AI worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
    
  } else {
    // Worker process - start the actual AI service
    startAIService();
  }
}

// ===========================================
// STARTUP AND SHUTDOWN HANDLERS
// ===========================================

async function startAIService() {
  console.log(`🤖 Starting OmniPost AI Service (Process ${process.pid})...`);
  
  // Initialize AI services
  await initializeAIServices();
  
  // Start HTTP server
  const port = process.env.AI_SERVICE_PORT || 3002;
  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ AI service listening on port ${port} (Process ${process.pid})`);
    console.log(`🔍 Health check available at http://localhost:${port}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`📤 AI Service ${process.pid} received SIGTERM, shutting down gracefully...`);
  
  server.close(() => {
    console.log(`✅ AI service ${process.pid} shut down complete`);
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(`📤 AI Service ${process.pid} received SIGINT, shutting down gracefully...`);
  
  server.close(() => {
    console.log(`✅ AI service ${process.pid} shut down complete`);
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`💥 Uncaught Exception in AI Service ${process.pid}:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`💥 Unhandled Rejection in AI Service ${process.pid} at:`, promise, 'reason:', reason);
  process.exit(1);
});

// Start the AI service (with or without clustering based on environment)
if (process.env.NODE_ENV === 'production' && process.env.USE_CLUSTERING !== 'false') {
  startWithClustering();
} else {
  startAIService().catch(console.error);
}
