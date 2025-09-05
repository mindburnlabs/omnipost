// ===========================================
// OMNIPOST WORKER SERVICE STARTUP
// ===========================================

const http = require('http');
const { execSync } = require('child_process');

// Worker service modules (will be loaded dynamically)
let publishingEngine, automationEngine, publishingQueue, notificationService;

async function initializeWorkerServices() {
  console.log('🔧 Initializing worker services...');
  
  try {
    // Import and initialize all background services
    const { getPublishingEngine } = require('../src/lib/publishing-engine');
    const { getAutomationEngine } = require('../src/lib/automation-engine');
    const { getPublishingQueue } = require('../src/lib/publishing-queue');
    const { getNotificationService } = require('../src/lib/notification-service');
    
    // Initialize all services
    publishingEngine = await getPublishingEngine();
    automationEngine = await getAutomationEngine();
    publishingQueue = await getPublishingQueue();
    notificationService = await getNotificationService();
    
    console.log('✅ All worker services initialized successfully');
    
    // Start background processing
    console.log('🚀 Starting background processing loops...');
    startBackgroundProcessing();
    
  } catch (error) {
    console.error('❌ Failed to initialize worker services:', error);
    process.exit(1);
  }
}

function startBackgroundProcessing() {
  // Publishing engine is already self-managing with its interval
  console.log('📡 Publishing engine started');
  
  // Automation engine is already self-managing
  console.log('🤖 Automation engine started');
  
  // Additional background tasks can be added here
  startHealthReporting();
  startMetricsCollection();
}

function startHealthReporting() {
  // Report health status every 5 minutes
  setInterval(async () => {
    try {
      const stats = await publishingEngine.getPublishingStats();
      const queueStats = await publishingQueue.getQueueStats();
      
      console.log(`📊 Worker Health - Queue: ${queueStats.pending} pending, ${queueStats.processing} processing, ${queueStats.completed} completed`);
    } catch (error) {
      console.error('Health reporting error:', error);
    }
  }, 5 * 60 * 1000);
}

function startMetricsCollection() {
  // Collect and log metrics every 10 minutes
  setInterval(async () => {
    try {
      const stats = await publishingEngine.getPublishingStats();
      console.log(`📈 Worker Metrics - Jobs processed in last hour: ${stats.hourlyProcessed || 0}`);
    } catch (error) {
      console.error('Metrics collection error:', error);
    }
  }, 10 * 60 * 1000);
}

// ===========================================
// HTTP SERVER FOR HEALTH CHECKS & API
// ===========================================

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  // Set CORS headers for service communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Name');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Service authentication middleware
  const authHeader = req.headers.authorization;
  if (!url.pathname.startsWith('/health') && (!authHeader || !authHeader.startsWith('Bearer '))) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    // Health check endpoint
    if (url.pathname === '/health' && method === 'GET') {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          publishingEngine: publishingEngine ? 'running' : 'stopped',
          automationEngine: automationEngine ? 'running' : 'stopped',
          publishingQueue: publishingQueue ? 'running' : 'stopped'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // Publishing API endpoints
    if (url.pathname === '/api/publish' && method === 'POST') {
      const body = await readRequestBody(req);
      const { postId } = JSON.parse(body);
      
      const jobId = await publishingEngine.publishNow(postId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, jobId }));
      return;
    }

    if (url.pathname === '/api/schedule' && method === 'POST') {
      const body = await readRequestBody(req);
      const { postId, scheduledAt } = JSON.parse(body);
      
      const jobId = await publishingEngine.schedulePost(postId, new Date(scheduledAt));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, jobId }));
      return;
    }

    if (url.pathname === '/api/retry' && method === 'POST') {
      const body = await readRequestBody(req);
      const { postId } = JSON.parse(body);
      
      const jobId = await publishingEngine.retryFailedPost(postId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, jobId }));
      return;
    }

    if (url.pathname === '/api/stats' && method === 'GET') {
      const stats = await publishingEngine.getPublishingStats();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: stats }));
      return;
    }

    // Automation API endpoints
    if (url.pathname === '/api/automation/trigger' && method === 'POST') {
      const body = await readRequestBody(req);
      const { ruleId } = JSON.parse(body);
      
      // Trigger specific automation rule
      const result = await automationEngine.processRule(ruleId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result }));
      return;
    }

    if (url.pathname === '/api/automation/dry-run' && method === 'POST') {
      const body = await readRequestBody(req);
      const { ruleId } = JSON.parse(body);
      
      const result = await automationEngine.dryRunRule(ruleId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
      return;
    }

    // 404 for unknown endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));

  } catch (error) {
    console.error('Worker API error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
});

// Helper function to read request body
function readRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

// ===========================================
// STARTUP AND SHUTDOWN HANDLERS
// ===========================================

async function startWorker() {
  console.log('🚀 Starting OmniPost Worker Service...');
  
  // Initialize all worker services
  await initializeWorkerServices();
  
  // Start HTTP server
  const port = process.env.WORKER_PORT || 3001;
  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Worker service listening on port ${port}`);
    console.log(`🔍 Health check available at http://localhost:${port}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 Received SIGTERM, shutting down gracefully...');
  
  if (publishingEngine) publishingEngine.stop();
  if (automationEngine) automationEngine.stop();
  
  server.close(() => {
    console.log('✅ Worker service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 Received SIGINT, shutting down gracefully...');
  
  if (publishingEngine) publishingEngine.stop();
  if (automationEngine) automationEngine.stop();
  
  server.close(() => {
    console.log('✅ Worker service shut down complete');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the worker service
startWorker().catch(console.error);
