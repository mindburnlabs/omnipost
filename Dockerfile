# Use Node.js 20 Debian for better native module compatibility (TailwindCSS 4 + lightningcss)
FROM node:20-slim AS base
# Install runtime libraries required by native bindings (Rust/C++)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libc6 \
    libgcc-s1 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
# Install necessary build tools for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files and scripts (needed for postinstall)
COPY package.json package-lock.json* .npmrc ./
COPY scripts/ ./scripts/
# Install dependencies with platform-specific optional packages
# Use npm install for better compatibility with dynamic native dependencies
RUN npm install --include=optional --no-audit --progress=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
# The universal native dependency manager will set WASM env vars automatically if needed

# Build-time environment variables for Supabase
# These need to be provided during docker build using --build-arg
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

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
# Copy public directory (create empty one first as fallback)
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
