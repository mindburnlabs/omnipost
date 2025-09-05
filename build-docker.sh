#!/bin/bash

# Docker Build Script for OmniPost
# This script builds the Docker image with the required environment variables

set -e

echo "🚀 Building OmniPost Docker image..."

# Check if .env file exists for local development
if [ -f ".env.local" ]; then
    echo "📁 Loading environment variables from .env.local"
    source .env.local
elif [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env"
    source .env
else
    echo "⚠️  No .env file found. Make sure to provide environment variables via command line or CI/CD."
fi

# Build the Docker image with build arguments
docker build \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder-key}" \
    --tag omnipost:latest \
    .

echo "✅ Docker build completed successfully!"
echo ""
echo "To run the container:"
echo "docker run -p 3000:3000 --env-file .env omnipost:latest"
echo ""
echo "Or with individual environment variables:"
echo "docker run -p 3000:3000 \\"
echo "  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \\"
echo "  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key \\"
echo "  omnipost:latest"
