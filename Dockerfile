# ===========================================
# UNIFIED OMNIPOST RAILWAY DOCKERFILE
# ===========================================

FROM node:18-alpine AS base

# Install system dependencies for all services
FROM base AS deps
RUN apk add --no-cache libc6-compat curl python3 make g++
WORKDIR /app

# Install npm dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else npm install --legacy-peer-deps; \
  fi

# Build Next.js for web service (only when needed)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npm run postinstall
# Only build Next.js if we need it (web service)
RUN if [ "$RAILWAY_SERVICE_NAME" = "omnipost-web" ] || [ "$RAILWAY_SERVICE_NAME" = "omnipost" ] || [ -z "$RAILWAY_SERVICE_NAME" ]; then npm run build; else echo "Skipping Next.js build for non-web service"; fi

# Production runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Create appropriate user based on service
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy dependencies and application code
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:nodejs . .

# Copy Next.js build if it exists (for web service)
COPY --from=builder --chown=appuser:nodejs /app/.next/standalone* ./ 2>/dev/null || echo "No Next.js build found"
COPY --from=builder --chown=appuser:nodejs /app/.next/static* ./.next/static/ 2>/dev/null || echo "No Next.js static files found"
COPY --from=builder /app/public ./public 2>/dev/null || echo "No public directory found"

# Create service-specific directories
RUN mkdir -p logs temp ai-cache models .next && chown appuser:nodejs logs temp ai-cache models .next

# Final setup
USER appuser
EXPOSE ${PORT:-3000}

# Health check (will be overridden by Railway for specific services)
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Universal startup command that detects service type
CMD ["node", "start-service.js"]
