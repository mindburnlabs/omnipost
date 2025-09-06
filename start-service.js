#!/usr/bin/env node

// ===========================================
// UNIFIED RAILWAY SERVICE STARTUP
// ===========================================

const path = require('path');

// Detect which service to run based on Railway environment variables
const serviceName = process.env.RAILWAY_SERVICE_NAME || process.env.SERVICE_NAME || 'web';
const port = process.env.PORT || 3000;

console.log(`🚀 Starting OmniPost Service: ${serviceName}`);
console.log(`🔧 Environment: NODE_ENV=${process.env.NODE_ENV}`);
console.log(`🔧 Port: ${port}`);
console.log(`🔧 Service ID: ${process.env.RAILWAY_SERVICE_ID}`);

// Route to appropriate service startup script
switch (serviceName) {
  case 'omnipost-ai':
    console.log('🤖 Loading AI Service...');
    require('./scripts/start-ai-simple.js');
    break;
    
  case 'omnipost-worker':
    console.log('⚙️ Loading Worker Service...');
    require('./scripts/start-worker-simple.js');
    break;
    
  case 'omnipost-web':
  case 'omnipost':
  default:
    console.log('🌐 Loading Web Service...');
    // For Next.js app, use the standalone server
    if (process.env.NODE_ENV === 'production') {
      // Check if standalone build exists
      const fs = require('fs');
      if (fs.existsSync('./server.js')) {
        console.log('📦 Using Next.js standalone server');
        require('./server.js');
      } else {
        console.log('⚠️ No standalone build found, starting production server');
        const { spawn } = require('child_process');
        const nextStart = spawn('npm', ['start'], { stdio: 'inherit' });
        nextStart.on('close', (code) => {
          console.log(`Next.js server exited with code ${code}`);
          process.exit(code);
        });
      }
    } else {
      // Development mode
      const { spawn } = require('child_process');
      const nextDev = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
      nextDev.on('close', (code) => {
        console.log(`Next.js dev server exited with code ${code}`);
        process.exit(code);
      });
    }
    break;
}
