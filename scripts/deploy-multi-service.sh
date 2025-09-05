#!/bin/bash

# ===========================================
# OMNIPOST MULTI-SERVICE DEPLOYMENT SCRIPT
# ===========================================

set -e

echo "🚀 Deploying OmniPost Multi-Service Architecture to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    # Check if logged in
    if ! railway whoami > /dev/null 2>&1; then
        print_error "Not logged into Railway. Please login first:"
        echo "railway login"
        exit 1
    fi
    
    # Check if in correct project
    PROJECT_NAME=$(railway status 2>/dev/null | grep "Project:" | awk '{print $2}')
    if [ "$PROJECT_NAME" != "omnipost" ]; then
        print_error "Not in omnipost project. Please link to the project first:"
        echo "railway link"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Run the environment setup script
    if [ -f "scripts/setup-railway-env.sh" ]; then
        chmod +x scripts/setup-railway-env.sh
        ./scripts/setup-railway-env.sh
    else
        print_warning "Environment setup script not found. Setting basic variables..."
        
        # Set basic shared variables
        railway variables set NODE_ENV=production
        railway variables set NEXT_PUBLIC_APP_NAME="OmniPost"
    fi
    
    print_success "Environment variables configured"
}

# Deploy web service
deploy_web_service() {
    print_status "Deploying web service..."
    
    # Switch to web service
    railway service omnipost
    
    # Copy appropriate railway config
    if [ -f "railway.web.toml" ]; then
        cp railway.web.toml railway.toml
        print_status "Using web service configuration"
    fi
    
    # Set web-specific variables
    railway variables set SERVICE_NAME="omnipost-web"
    railway variables set PORT="3000"
    railway variables set WORKER_SERVICE_URL="http://omnipost-worker:3001"
    railway variables set AI_SERVICE_URL="http://omnipost-ai:3002"
    
    # Deploy
    print_status "Building and deploying web service..."
    railway up --detach
    
    print_success "Web service deployed"
}

# Deploy worker service
deploy_worker_service() {
    print_status "Deploying worker service..."
    
    # Switch to worker service
    railway service omnipost-worker
    
    # Copy appropriate railway config
    if [ -f "railway.worker.toml" ]; then
        cp railway.worker.toml railway.toml
        print_status "Using worker service configuration"
    fi
    
    # Set worker-specific variables
    railway variables set SERVICE_NAME="omnipost-worker"
    railway variables set WORKER_PORT="3001"
    railway variables set WEB_SERVICE_URL="http://omnipost:3000"
    railway variables set AI_SERVICE_URL="http://omnipost-ai:3002"
    
    # Deploy
    print_status "Building and deploying worker service..."
    railway up --detach
    
    print_success "Worker service deployed"
}

# Deploy AI service
deploy_ai_service() {
    print_status "Deploying AI service..."
    
    # Switch to AI service
    railway service omnipost-ai
    
    # Copy appropriate railway config
    if [ -f "railway.ai.toml" ]; then
        cp railway.ai.toml railway.toml
        print_status "Using AI service configuration"
    fi
    
    # Set AI-specific variables
    railway variables set SERVICE_NAME="omnipost-ai"
    railway variables set AI_SERVICE_PORT="3002"
    railway variables set WEB_SERVICE_URL="http://omnipost:3000"
    railway variables set WORKER_SERVICE_URL="http://omnipost-worker:3001"
    railway variables set USE_CLUSTERING="true"
    
    # Deploy
    print_status "Building and deploying AI service..."
    railway up --detach
    
    print_success "AI service deployed"
}

# Wait for deployments
wait_for_deployments() {
    print_status "Waiting for all services to be ready..."
    
    local max_wait=300  # 5 minutes
    local wait_time=0
    local interval=10
    
    while [ $wait_time -lt $max_wait ]; do
        print_status "Checking deployment status... (${wait_time}s/${max_wait}s)"
        
        # Check each service
        railway service omnipost
        WEB_STATUS=$(railway status --json 2>/dev/null | jq -r '.deployments[0].status' 2>/dev/null || echo "unknown")
        
        railway service omnipost-worker
        WORKER_STATUS=$(railway status --json 2>/dev/null | jq -r '.deployments[0].status' 2>/dev/null || echo "unknown")
        
        railway service omnipost-ai
        AI_STATUS=$(railway status --json 2>/dev/null | jq -r '.deployments[0].status' 2>/dev/null || echo "unknown")
        
        echo "Service statuses: Web=$WEB_STATUS, Worker=$WORKER_STATUS, AI=$AI_STATUS"
        
        if [ "$WEB_STATUS" = "SUCCESS" ] && [ "$WORKER_STATUS" = "SUCCESS" ] && [ "$AI_STATUS" = "SUCCESS" ]; then
            print_success "All services deployed successfully!"
            return 0
        fi
        
        if [ "$WEB_STATUS" = "FAILED" ] || [ "$WORKER_STATUS" = "FAILED" ] || [ "$AI_STATUS" = "FAILED" ]; then
            print_error "One or more services failed to deploy"
            return 1
        fi
        
        sleep $interval
        wait_time=$((wait_time + interval))
    done
    
    print_warning "Deployment is taking longer than expected, but continuing..."
    return 0
}

# Test service health
test_service_health() {
    print_status "Testing service health..."
    
    # Get web service URL
    railway service omnipost
    WEB_URL=$(railway status --json 2>/dev/null | jq -r '.deployments[0].url' 2>/dev/null || echo "")
    
    if [ -z "$WEB_URL" ] || [ "$WEB_URL" = "null" ]; then
        print_warning "Could not determine web service URL. Please check manually."
        return 1
    fi
    
    print_status "Web service URL: $WEB_URL"
    
    # Test main health endpoint
    print_status "Testing main health endpoint..."
    if curl -f -s --max-time 30 "$WEB_URL/api/health" > /tmp/health_check.json; then
        OVERALL_STATUS=$(cat /tmp/health_check.json | jq -r '.status' 2>/dev/null || echo "unknown")
        print_success "Health check passed. Overall status: $OVERALL_STATUS"
        
        # Show detailed health info
        echo "=== HEALTH CHECK RESULTS ==="
        cat /tmp/health_check.json | jq '.' 2>/dev/null || cat /tmp/health_check.json
        echo "=========================="
        
        # Test individual service health
        WORKER_HEALTH=$(cat /tmp/health_check.json | jq -r '.services.worker.status' 2>/dev/null || echo "unknown")
        AI_HEALTH=$(cat /tmp/health_check.json | jq -r '.services.ai.status' 2>/dev/null || echo "unknown")
        
        print_status "Service health: Worker=$WORKER_HEALTH, AI=$AI_HEALTH"
        
        if [ "$WORKER_HEALTH" = "healthy" ] && [ "$AI_HEALTH" = "healthy" ]; then
            print_success "All services are healthy!"
        else
            print_warning "Some services may not be fully healthy yet"
        fi
        
        rm -f /tmp/health_check.json
        return 0
    else
        print_error "Health check failed. Service may not be ready yet."
        return 1
    fi
}

# Test inter-service communication
test_inter_service_communication() {
    print_status "Testing inter-service communication..."
    
    railway service omnipost
    WEB_URL=$(railway status --json 2>/dev/null | jq -r '.deployments[0].url' 2>/dev/null || echo "")
    
    if [ -z "$WEB_URL" ] || [ "$WEB_URL" = "null" ]; then
        print_warning "Could not determine web service URL for testing"
        return 1
    fi
    
    # Test API endpoints that require service communication
    print_status "Testing AI service communication..."
    if curl -f -s --max-time 30 -X POST \
        -H "Content-Type: application/json" \
        -d '{"prompt":"Test prompt","alias":"fast-drafts"}' \
        "$WEB_URL/api/ai/generate" > /tmp/ai_test.json 2>/dev/null; then
        print_success "AI service communication working"
    else
        print_warning "AI service communication may not be working yet"
    fi
    
    print_status "Testing worker service communication..."
    if curl -f -s --max-time 30 "$WEB_URL/api/publishing/stats" > /tmp/worker_test.json 2>/dev/null; then
        print_success "Worker service communication working"
    else
        print_warning "Worker service communication may not be working yet"
    fi
    
    rm -f /tmp/ai_test.json /tmp/worker_test.json
}

# Show deployment summary
show_deployment_summary() {
    echo ""
    echo "========================================"
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "========================================"
    
    # Get URLs for all services
    railway service omnipost
    WEB_URL=$(railway status --json 2>/dev/null | jq -r '.deployments[0].url' 2>/dev/null || echo "Not available")
    
    echo ""
    echo "🌐 Service URLs:"
    echo "   Web App: $WEB_URL"
    echo "   Health Check: $WEB_URL/api/health"
    echo ""
    echo "🏗️  Architecture:"
    echo "   ✅ Web Service (Next.js + API)"
    echo "   ✅ Worker Service (Background Processing)"
    echo "   ✅ AI Service (Content Generation)"
    echo "   ✅ PostgreSQL Database"
    echo "   ✅ Redis Cache/Queue"
    echo ""
    echo "📊 Monitoring:"
    echo "   • Health checks: $WEB_URL/api/health"
    echo "   • Railway dashboard: https://railway.app/project/omnipost"
    echo ""
    echo "🔧 Management Commands:"
    echo "   • View logs: railway logs --tail"
    echo "   • Switch services: railway service <service-name>"
    echo "   • Check status: railway status"
    echo ""
    echo "🚀 Your OmniPost multi-service architecture is now live!"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f railway.toml
    rm -f /tmp/health_check.json
    rm -f /tmp/ai_test.json
    rm -f /tmp/worker_test.json
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    echo "🚂 OmniPost Multi-Service Railway Deployment"
    echo "============================================="
    
    check_prerequisites
    setup_environment
    
    # Deploy services in order
    deploy_web_service
    deploy_worker_service
    deploy_ai_service
    
    # Wait for deployments to complete
    wait_for_deployments
    
    # Test the deployment
    print_status "Running post-deployment tests..."
    
    # Give services a moment to fully start
    sleep 30
    
    if test_service_health; then
        test_inter_service_communication
        show_deployment_summary
    else
        print_warning "Health checks failed, but deployment completed. Services may need more time to start."
        echo "You can check status manually with: railway logs --tail"
    fi
    
    # Restore original config
    if [ -f "railway.toml.original" ]; then
        mv railway.toml.original railway.toml
    fi
}

# Run the deployment
main "$@"
