#!/bin/bash

# Docker Run Script for OmniPost
# This script runs the Docker container with all required environment variables

set -e

echo "🚀 Starting OmniPost Docker container..."

# Check if .env file exists and load it
if [ -f ".env.local" ]; then
    echo "📁 Loading environment variables from .env.local"
    source .env.local
elif [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env"
    source .env
else
    echo "❌ No .env file found. Please create one with your environment variables."
    exit 1
fi

# Validate required environment variables
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "POSTGREST_URL"
    "POSTGREST_SCHEMA"
    "POSTGREST_API_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf ' - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please add these variables to your .env file."
    exit 1
fi

# Stop any existing container
echo "🛑 Stopping any existing omnipost container..."
docker stop omnipost 2>/dev/null || true
docker rm omnipost 2>/dev/null || true

# Run the Docker container with all environment variables
echo "🏃 Running OmniPost container..."
docker run -d \
    --name omnipost \
    -p 3000:3000 \
    -e NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME}" \
    -e NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
    -e NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
    -e NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -e SUPABASE_URL="${SUPABASE_URL}" \
    -e SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}" \
    -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
    -e POSTGREST_URL="${POSTGREST_URL}" \
    -e POSTGREST_SCHEMA="${POSTGREST_SCHEMA}" \
    -e POSTGREST_API_KEY="${POSTGREST_API_KEY}" \
    -e SCHEMA_ADMIN_USER="${SCHEMA_ADMIN_USER}" \
    -e JWT_SECRET="${JWT_SECRET}" \
    -e HASH_SALT_KEY="${HASH_SALT_KEY}" \
    -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
    -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
    -e WHOP_API_KEY="${WHOP_API_KEY}" \
    -e NEXT_PUBLIC_WHOP_APP_ID="${NEXT_PUBLIC_WHOP_APP_ID}" \
    -e NEXT_PUBLIC_WHOP_AGENT_USER_ID="${NEXT_PUBLIC_WHOP_AGENT_USER_ID}" \
    -e NEXT_PUBLIC_WHOP_COMPANY_ID="${NEXT_PUBLIC_WHOP_COMPANY_ID}" \
    -e DISCORD_APPLICATION_ID="${DISCORD_APPLICATION_ID}" \
    -e DISCORD_PUBLIC_KEY="${DISCORD_PUBLIC_KEY}" \
    -e DISCORD_CLIENT_ID="${DISCORD_CLIENT_ID}" \
    -e DISCORD_CLIENT_SECRET="${DISCORD_CLIENT_SECRET}" \
    -e TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
    -e RESEND_KEY="${RESEND_KEY}" \
    omnipost:latest

echo "✅ OmniPost container is running!"
echo ""
echo "📝 Container logs:"
echo "  docker logs -f omnipost"
echo ""
echo "🌐 Access the app at: http://localhost:3000"
echo ""
echo "🛑 To stop the container:"
echo "  docker stop omnipost"
