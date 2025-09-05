# OmniPost Deployment Guide

This guide covers deployment configurations for both standalone and Whop-embedded modes.

## 🏗️ Architecture Overview

OmniPost supports two deployment modes:

1. **Standalone SaaS**: Independent deployment with own domain, auth, and billing
2. **Whop Embedded**: Runs as an embedded experience within Whop platform

## 🔧 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database or PostgREST endpoint
- Environment variables configured (see `.env.example`)
- Platform API keys for Discord, Telegram, Whop (as needed)

## 🚀 Deployment Options

### Option 1: Railway (Recommended for Full-Stack Apps)

**Best for**: Production deployments with database integration

See [RAILWAY.md](./RAILWAY.md) for complete Railway deployment guide.

**Quick Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy to Railway
railway login
railway init
railway up
```

### Option 2: Vercel (Recommended for Static/Serverless)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Environment Variables**
   Set these in Vercel dashboard or via CLI:
   ```bash
   vercel env add POSTGREST_URL
   vercel env add POSTGREST_API_KEY
   vercel env add JWT_SECRET
   # ... add all required variables from .env.example
   ```

3. **Build Configuration**
   Vercel automatically detects Next.js. Custom `vercel.json` if needed:
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install"
   }
   ```

### Option 2: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t omnipost .
   docker run -p 3000:3000 --env-file .env omnipost
   ```

3. **Docker Compose** (with database)
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       env_file: .env
       depends_on:
         - postgres
     
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: omnipost
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

### Option 3: Traditional VPS/Server

1. **Server Setup**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   
   # Clone and setup
   git clone https://github.com/yourusername/omnipost.git
   cd omnipost
   npm install
   npm run build
   ```

2. **PM2 Process Management**
   ```bash
   npm install -g pm2
   
   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'omnipost',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   EOF
   
   # Start application
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Nginx Reverse Proxy**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## 🌐 Domain & SSL Configuration

### Vercel
- Automatic SSL via Let's Encrypt
- Custom domain configuration in dashboard
- Automatic redirects and edge caching

### Manual SSL (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔗 Whop Embedded Mode

### 1. Whop App Configuration

In your Whop developer dashboard:

- **App URL**: `https://your-domain.com/whop`
- **Iframe Settings**: Enable iframe embedding
- **Webhook URL**: `https://your-domain.com/next_api/webhooks/whop`
- **Scopes**: User info, subscription management

### 2. CORS and Iframe Headers

Already configured in `next.config.ts`:
```typescript
async headers() {
  return [{
    source: "/:path*",
    headers: [
      {
        key: "X-Frame-Options",
        value: "ALLOWALL"
      },
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self' *"
      }
    ]
  }];
}
```

### 3. Whop Environment Variables

```bash
# Whop Integration (required for embedded mode)
WHOP_API_KEY=your_whop_api_key
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_whop_company_id
```

### 4. Testing Whop Integration

```bash
# Test locally with Whop context simulation
curl "http://localhost:3000/whop?user_id=test&user_email=test@example.com&access=granted"

# Test webhook endpoint
curl -X POST http://localhost:3000/next_api/webhooks/whop \
  -H "Content-Type: application/json" \
  -d '{"type":"user.subscription.created","data":{"user":{"id":"test","email":"test@example.com"}}}'
```

## 📊 Database Setup

### PostgREST (Current)
- Already configured for PostgREST endpoint
- Schema migrations in `supabase/migrations/`
- Run migrations against your PostgREST instance

### Direct PostgreSQL
If migrating to direct PostgreSQL:

1. **Update Environment**
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. **Update Connection Logic**
   Replace PostgREST calls in `src/lib/crud-operations.ts` with direct SQL queries

## 🔒 Security Checklist

### Production Environment
- [ ] Secure JWT secrets (256-bit random)
- [ ] HTTPS enabled with valid certificate
- [ ] Database credentials secured
- [ ] API keys stored as environment variables
- [ ] CORS configured for your domains only
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Whop Embedded Mode
- [ ] Webhook signature verification enabled
- [ ] Iframe security headers configured
- [ ] Whop domain allowlisted in CSP
- [ ] User authentication via Whop validated

## 📈 Monitoring & Logging

### Application Monitoring
```bash
# Add logging service (e.g., LogDNA, DataDog)
npm install pino pino-pretty

# Add health check endpoint
curl https://your-domain.com/next_api/health
```

### Error Tracking
```bash
# Sentry integration
npm install @sentry/nextjs

# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

## 🚦 Health Checks

Built-in health check endpoint: `/next_api/system/health`

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "discord": "configured",
    "telegram": "configured",
    "whop": "configured"
  }
}
```

## 🔄 Updates & Maintenance

### Zero-Downtime Deployment
```bash
# Blue-green deployment with PM2
pm2 start ecosystem.config.js --name omnipost-new
# Test new version
pm2 delete omnipost-old
pm2 restart omnipost-new --name omnipost
```

### Database Migrations
```bash
# Run new migrations
npm run migrate:latest

# Rollback if needed
npm run migrate:rollback
```

## 📋 Environment Variables Reference

See `.env.example` for complete list:
- **Core**: APP_NAME, APP_URL, JWT_SECRET
- **Database**: POSTGREST_URL, POSTGREST_API_KEY
- **Platforms**: DISCORD_*, TELEGRAM_*, WHOP_*
- **Services**: RESEND_KEY, AI service keys
- **Features**: ENABLE_AUTH, DEMO_MODE

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Database Connection**
   ```bash
   # Test PostgREST endpoint
   curl "$POSTGREST_URL/users" -H "apikey: $POSTGREST_API_KEY"
   ```

3. **Whop Integration**
   ```bash
   # Test Whop API
   curl "https://api.whop.com/api/v2/companies/$WHOP_COMPANY_ID" \
     -H "Authorization: Bearer $WHOP_API_KEY"
   ```

4. **Platform APIs**
   - Discord: Check webhook URL format
   - Telegram: Verify bot token and chat permissions
   - Whop: Confirm app configuration and permissions

### Logs
- Application logs: Check PM2 logs or container logs
- Next.js logs: In `.next/trace` during build
- Platform integration logs: Check network tab for API calls

For additional support, see the main README or create an issue in the repository.
