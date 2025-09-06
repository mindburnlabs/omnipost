// ===========================================
// SIMPLIFIED OMNIPOST AI SERVICE STARTUP
// ===========================================

const http = require('http');

console.log('🤖 Starting OmniPost AI Service...');

// Simple health check server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health check endpoint
    if (url.pathname === '/health' && req.method === 'GET') {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'omnipost-ai',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // Default response for other endpoints
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'AI Service is running',
      service: 'omnipost-ai',
      status: 'ready'
    }));

  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
});

// Start server
const port = process.env.AI_SERVICE_PORT || 3002;
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ AI service listening on port ${port}`);
  console.log(`🔍 Health check available at http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 AI Service received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ AI service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 AI Service received SIGINT, shutting down...');
  server.close(() => {
    console.log('✅ AI service shut down complete');
    process.exit(0);
  });
});
