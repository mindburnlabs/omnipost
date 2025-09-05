#!/bin/bash

# ===========================================
# RAILWAY SERVICE CONFIGURATION SETUP
# ===========================================

set -e

echo "🔧 Setting up Railway service configurations..."

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Configure web service
configure_web_service() {
    print_status "Configuring web service..."
    
    railway service omnipost
    
    # Set web-specific build settings via Railway CLI if needed
    # The main railway.toml already handles the web service configuration
    
    print_success "Web service configured"
}

# Configure worker service  
configure_worker_service() {
    print_status "Configuring worker service..."
    
    railway service omnipost-worker
    
    # Set worker service to use worker Dockerfile
    # Note: Railway CLI doesn't directly support per-service railway.toml files
    # We'll need to set this up in the Railway dashboard or use API
    
    print_status "Worker service configuration set"
}

# Configure AI service
configure_ai_service() {
    print_status "Configuring AI service..."
    
    railway service omnipost-ai
    
    # Set AI service to use AI Dockerfile  
    print_status "AI service configuration set"
}

# Main configuration function
main() {
    echo "🚂 Configuring Railway Services"
    echo "================================"
    
    configure_web_service
    configure_worker_service
    configure_ai_service
    
    print_status "Service configurations complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to Railway dashboard to set Dockerfile paths:"
    echo "   • omnipost: Use Dockerfile.web"
    echo "   • omnipost-worker: Use Dockerfile.worker" 
    echo "   • omnipost-ai: Use Dockerfile.ai"
    echo ""
    echo "2. Deploy services:"
    echo "   railway service omnipost && railway up"
    echo "   railway service omnipost-worker && railway up"
    echo "   railway service omnipost-ai && railway up"
}

main "$@"
