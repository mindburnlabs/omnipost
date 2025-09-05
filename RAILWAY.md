# 🚂 Railway Deployment Guide

This guide covers deploying OmniPost to Railway with optimal configuration.

## 🚀 Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/xyz)

## 📋 Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **Supabase Database** - Your existing Supabase project  
3. **Platform API Keys** - Discord, Telegram, Whop credentials
4. **GitHub Repository** - Fork or clone this repo

## 🔧 Deployment Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 2. Configure Environment Variables

Copy variables from `.env.railway` to your Railway dashboard:

**Essential Variables:**
```bash
# Security (Generate 32+ character random strings)
JWT_SECRET=your_secure_jwt_secret_here
HASH_SALT_KEY=your_secure_hash_salt_here

# Database (From your Supabase project)  
POSTGREST_URL=https://your-project.supabase.co/rest/v1
POSTGREST_API_KEY=your_supabase_service_role_key
POSTGREST_SCHEMA=your_schema_name
SCHEMA_ADMIN_USER=your_admin_role_name

# Platform APIs
DISCORD_APPLICATION_ID=your_discord_app_id
DISCORD_CLIENT_SECRET=your_discord_secret  
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WHOP_API_KEY=your_whop_api_key
```

### 3. Deploy

```bash
# Deploy to Railway
railway up

# Check deployment status
railway status

# View logs
railway logs
```

## 🔍 Health Checks

Railway uses `/next_api/system/health` for health monitoring.

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": {
    "connected": true,
    "responseTime": 45
  },
  "services": {
    "platforms": {
      "discord": true,
      "telegram": true,
      "whop": true
    }
  }
}
```

## ⚡ Performance Optimizations

### Build Optimizations
- Uses `npm ci` for faster, reproducible builds
- Prunes dev dependencies in production  
- Enables Next.js standalone output
- Disables Next.js telemetry

### Runtime Optimizations
- Health check timeout: 30 seconds
- Auto-restart on failure (max 10 retries)
- Production environment variables
- Optimized Node.js settings

## 🌐 Custom Domains

### Add Custom Domain

1. Go to Railway dashboard → Project → Settings
2. Click "Domains" → "Custom Domain"  
3. Add your domain: `app.yourdomain.com`
4. Update DNS: `CNAME app railway.app`
5. Update environment variable:
   ```bash
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   ```

## 🔗 Whop Integration

### For Whop Embedded Mode

1. **Configure Whop App:**
   - App URL: `https://your-railway-url.railway.app/whop`
   - Webhook URL: `https://your-railway-url.railway.app/next_api/webhooks/whop`

2. **Set Environment Variables:**
   ```bash
   WHOP_API_KEY=your_whop_api_key
   WHOP_WEBHOOK_SECRET=your_webhook_secret  
   NEXT_PUBLIC_WHOP_APP_ID=your_app_id
   NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id
   ```

3. **Test Integration:**
   ```bash
   curl https://your-app.railway.app/whop?user_id=test&user_email=test@example.com&access=granted
   ```

## 📊 Monitoring

### Built-in Monitoring

Railway provides automatic monitoring for:
- CPU usage
- Memory usage  
- Network traffic
- Response times
- Error rates

### Health Check Alerts

Configure alerts in Railway dashboard:
- Health check failures
- High error rates
- Memory usage spikes
- Deployment failures

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   railway logs --deployment

   # Common fix: Clear build cache
   railway run --service web npm run clean
   railway up --detach
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   curl https://your-app.railway.app/next_api/system/health
   
   # Check environment variables
   railway variables
   ```

3. **Environment Variables**
   ```bash
   # List all variables
   railway variables

   # Set missing variable
   railway variables set JWT_SECRET=your_secret_here
   ```

4. **Health Check Failures**
   - Check `/next_api/system/health` endpoint responds
   - Verify database connectivity
   - Check platform API credentials

### Performance Issues

1. **Slow Response Times**
   - Check database query performance
   - Monitor PostgREST response times
   - Consider adding Redis caching

2. **Memory Usage**
   - Monitor Node.js heap usage
   - Consider upgrading Railway plan
   - Optimize database queries

## 💡 Production Tips

### Security
- Use Railway's built-in secrets management
- Enable HTTPS redirects
- Set secure JWT secrets (32+ chars)
- Regularly rotate API keys

### Performance  
- Enable Next.js optimizations
- Use Railway's CDN for static assets
- Monitor health check response times
- Set up proper error tracking

### Monitoring
- Set up Railway alerts
- Monitor database performance
- Track API usage rates
- Set up uptime monitoring

## 🔄 CI/CD Pipeline

### Auto-Deploy Setup

1. **Connect GitHub:**
   ```bash
   railway connect
   ```

2. **Auto-Deploy Configuration:**
   - Railway automatically deploys on push to `main`
   - Health checks prevent bad deployments
   - Rollback available in dashboard

3. **Environment-Specific Deploys:**
   ```bash
   # Production (main branch)
   railway environment production
   
   # Staging (develop branch) 
   railway environment staging
   ```

## 📞 Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **OmniPost Issues:** [GitHub Issues](https://github.com/yourusername/omnipost/issues)

---

**Ready for production!** 🎉

Your OmniPost deployment on Railway will be highly available, automatically scaling, and properly monitored.
