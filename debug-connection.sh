#!/bin/bash

# Debug PostgREST Connection Script
# This script helps diagnose database connection issues

set -e

echo "🔍 Debugging PostgREST connection..."
echo ""

# Load environment variables
if [ -f ".env.local" ]; then
    echo "📁 Loading environment variables from .env.local"
    source .env.local
elif [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env"
    source .env
else
    echo "❌ No .env file found."
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Check required environment variables
echo "🔧 Checking environment variables:"
echo "  POSTGREST_URL: ${POSTGREST_URL:-❌ NOT SET}"
echo "  POSTGREST_SCHEMA: ${POSTGREST_SCHEMA:-❌ NOT SET}"
echo "  POSTGREST_API_KEY: ${POSTGREST_API_KEY:0:20}... (${#POSTGREST_API_KEY} chars)"
echo ""

# Test PostgREST connection
echo "🌐 Testing PostgREST connection..."

if [ -z "$POSTGREST_URL" ] || [ -z "$POSTGREST_API_KEY" ]; then
    echo "❌ Missing required environment variables"
    exit 1
fi

# Test basic connectivity
echo "1️⃣ Testing basic connectivity..."
response=$(curl -s -w "%{http_code}" -o /tmp/postgrest_test.json \
    -H "apikey: $POSTGREST_API_KEY" \
    -H "Content-Type: application/json" \
    "$POSTGREST_URL/")

if [ "$response" = "200" ]; then
    echo "✅ PostgREST endpoint is reachable"
else
    echo "❌ PostgREST endpoint returned HTTP $response"
    echo "Response body:"
    cat /tmp/postgrest_test.json
    exit 1
fi

# Test table access
echo ""
echo "2️⃣ Testing table access..."
response=$(curl -s -w "%{http_code}" -o /tmp/postgrest_posts.json \
    -H "apikey: $POSTGREST_API_KEY" \
    -H "Content-Type: application/json" \
    "$POSTGREST_URL/posts?limit=1")

if [ "$response" = "200" ]; then
    echo "✅ Posts table is accessible"
    echo "Sample data:"
    cat /tmp/postgrest_posts.json | head -c 200
    echo "..."
elif [ "$response" = "401" ]; then
    echo "❌ Authentication failed (HTTP 401)"
    echo "Response body:"
    cat /tmp/postgrest_posts.json
    echo ""
    echo "💡 This suggests the API key is invalid or has wrong permissions"
elif [ "$response" = "404" ]; then
    echo "❌ Posts table not found (HTTP 404)"
    echo "Response body:"
    cat /tmp/postgrest_posts.json
    echo ""
    echo "💡 This suggests the table doesn't exist or isn't accessible"
else
    echo "❌ Posts table access failed with HTTP $response"
    echo "Response body:"
    cat /tmp/postgrest_posts.json
fi

# Test with Authorization header (user token simulation)
echo ""
echo "3️⃣ Testing with Authorization header..."
response=$(curl -s -w "%{http_code}" -o /tmp/postgrest_auth.json \
    -H "apikey: $POSTGREST_API_KEY" \
    -H "Authorization: Bearer $POSTGREST_API_KEY" \
    -H "Content-Type: application/json" \
    "$POSTGREST_URL/posts?limit=1")

if [ "$response" = "200" ]; then
    echo "✅ Authorization header works"
else
    echo "⚠️  Authorization header returned HTTP $response"
    echo "Response body:"
    cat /tmp/postgrest_auth.json | head -c 200
    echo "..."
fi

# Check if container is running and test inside container
echo ""
echo "4️⃣ Checking Docker container status..."
if docker ps --format "table {{.Names}}" | grep -q "omnipost"; then
    echo "✅ OmniPost container is running"
    
    echo "🔍 Testing environment variables inside container..."
    docker exec omnipost sh -c 'echo "POSTGREST_URL: $POSTGREST_URL"'
    docker exec omnipost sh -c 'echo "POSTGREST_API_KEY length: ${#POSTGREST_API_KEY}"'
    
    echo "🌐 Testing connection from inside container..."
    docker exec omnipost sh -c 'curl -s -I -H "apikey: $POSTGREST_API_KEY" "$POSTGREST_URL/" | head -1' || echo "❌ Connection failed from container"
else
    echo "⚠️  OmniPost container is not running"
    echo "💡 Run: ./run-docker.sh to start the container"
fi

echo ""
echo "🎯 Debug complete!"
echo ""
echo "If you're still getting connection errors:"
echo "1. Check that the Supabase project is active"
echo "2. Verify the service role key has the right permissions"
echo "3. Make sure RLS policies allow the service role to access data"
echo "4. Check if the PostgREST client is using the right headers"

# Cleanup
rm -f /tmp/postgrest_*.json
