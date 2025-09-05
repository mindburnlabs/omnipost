# Use Node.js 20 Debian for better native module compatibility (TailwindCSS 4 + lightningcss)
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install necessary build tools for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* .npmrc ./
# Install dependencies with correct platform-specific optional packages (lightningcss, oxide, sharp, etc.)
# Use npm install (not ci) to allow resolving Linux-specific optional deps even if lockfile was generated on macOS
RUN npm install --include=optional --no-audit --progress=false
# Ensure lightningcss native binding is present for this platform
RUN npm rebuild lightningcss || true

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1

# Build the app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
