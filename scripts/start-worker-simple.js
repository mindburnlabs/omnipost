// ===========================================
// SIMPLIFIED OMNIPOST WORKER SERVICE STARTUP
// ===========================================

const http = require('http');

console.log('⚙️ Starting OmniPost Worker Service...');

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
        service: 'omnipost-worker',
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
      message: 'Worker Service is running',
      service: 'omnipost-worker',
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
const port = process.env.PORT || process.env.WORKER_PORT || 3001;

console.log(`🔧 Environment: NODE_ENV=${process.env.NODE_ENV}`);
console.log(`🔧 Port configuration: PORT=${process.env.PORT}, WORKER_PORT=${process.env.WORKER_PORT}, using=${port}`);

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Worker service listening on port ${port}`);
  console.log(`🔍 Health check available at http://localhost:${port}/health`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 Worker Service received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Worker service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 Worker Service received SIGINT, shutting down...');
  server.close(() => {
    console.log('✅ Worker service shut down complete');
    process.exit(0);
  });
});
