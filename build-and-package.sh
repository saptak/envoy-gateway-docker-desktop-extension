#!/bin/bash

# Comprehensive build and package script for Envoy Gateway Docker Desktop Extension

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="${PROJECT_DIR}/envoy-gateway-extension"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    log_info "Cleaning previous builds..."
    rm -rf "${EXTENSION_DIR}"
    mkdir -p "${EXTENSION_DIR}"
    log_success "Build directory cleaned"
}

# Build backend
build_backend() {
    log_info "Building backend..."
    cd "${PROJECT_DIR}/src/backend"
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm ci
    
    # Run tests
    log_info "Running backend tests..."
    npm test
    
    # Build backend
    log_info "Compiling TypeScript backend..."
    npm run build
    
    # Copy built backend
    cp -r dist/* "${EXTENSION_DIR}/backend/"
    cp package.json package-lock.json "${EXTENSION_DIR}/backend/"
    
    # Install production dependencies in extension directory
    cd "${EXTENSION_DIR}/backend"
    npm ci --only=production
    
    cd "${PROJECT_DIR}"
    log_success "Backend build completed"
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    cd "${PROJECT_DIR}/src/frontend"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci
    
    # Run tests
    log_info "Running frontend tests..."
    npm test -- --passWithNoTests
    
    # Build frontend
    log_info "Building React application..."
    npm run build
    
    # Copy built frontend
    cp -r dist/* "${EXTENSION_DIR}/ui/"
    
    cd "${PROJECT_DIR}"
    log_success "Frontend build completed"
}

# Copy extension assets
copy_assets() {
    log_info "Copying extension assets..."
    
    # Copy metadata
    cp docker-extension.json "${EXTENSION_DIR}/metadata.json"
    
    # Copy icon
    cp icon.svg "${EXTENSION_DIR}/"
    
    # Copy Docker files
    cp Dockerfile.production "${EXTENSION_DIR}/Dockerfile"
    
    log_success "Assets copied"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."
    cd "${EXTENSION_DIR}"
    
    # Build the image
    docker build -t envoy-gateway-extension:latest .
    
    cd "${PROJECT_DIR}"
    log_success "Docker image built successfully"
}

# Validate extension
validate_extension() {
    log_info "Validating extension structure..."
    
    # Check required files
    required_files=(
        "metadata.json"
        "icon.svg"
        "Dockerfile"
        "backend/index.js"
        "backend/package.json"
        "ui/index.html"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "${EXTENSION_DIR}/${file}" ]]; then
            log_error "Required file missing: ${file}"
            exit 1
        fi
    done
    
    log_success "Extension structure validated"
}

# Test installation (optional)
test_installation() {
    if [[ "$1" == "--test-install" ]]; then
        log_info "Testing extension installation..."
        docker extension uninstall envoy-gateway-extension 2>/dev/null || true
        docker extension install envoy-gateway-extension:latest
        log_success "Extension installed successfully for testing"
    fi
}

# Main build process
main() {
    log_info "Starting Envoy Gateway Extension build process..."
    
    check_prerequisites
    clean_build
    
    # Build backend
    build_backend
    
    # Build frontend  
    build_frontend
    
    # Copy assets
    copy_assets
    
    # Validate structure
    validate_extension
    
    # Build Docker image
    build_docker_image
    
    # Test installation if requested
    test_installation "$1"
    
    log_success "=== Build Completed Successfully ==="
    log_info "Extension image: envoy-gateway-extension:latest"
    log_info "To install: docker extension install envoy-gateway-extension:latest"
}

# Parse command line arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Build the Envoy Gateway Docker Desktop Extension"
        echo ""
        echo "Options:"
        echo "  --test-install    Install the extension after building"
        echo "  --help, -h        Show this help message"
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac