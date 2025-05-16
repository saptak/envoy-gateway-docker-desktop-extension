#!/bin/bash

# Envoy Gateway Docker Desktop Extension Build Script
# Optimized for Docker Desktop Extension distribution

set -e

# Configuration
EXTENSION_NAME="envoy-gateway-extension"
EXTENSION_VERSION="${VERSION:-1.0.0}"
EXTENSION_TAG="${TAG:-latest}"
EXTENSION_IMAGE="${EXTENSION_NAME}:${EXTENSION_TAG}"
REGISTRY_PREFIX="${REGISTRY_PREFIX:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Building Envoy Gateway Docker Desktop Extension...${NC}"
echo -e "${GREEN}Version: ${EXTENSION_VERSION}${NC}"
echo -e "${GREEN}Image: ${EXTENSION_IMAGE}${NC}"

# Validate system requirements
echo -e "${YELLOW}🔍 Validating system requirements...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Navigate to extension directory
cd envoy-gateway-extension

# Check if required files exist
echo -e "${YELLOW}📋 Checking required files...${NC}"
required_files=("metadata.json" "icon.svg" "Dockerfile")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done

# Validate frontend and backend directories
if [[ ! -d "ui-new" ]]; then
    echo -e "${RED}❌ Frontend directory 'ui-new' not found${NC}"
    exit 1
fi

if [[ ! -d "backend-new" ]]; then
    echo -e "${RED}❌ Backend directory 'backend-new' not found${NC}"
    exit 1
fi

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
docker rmi "${EXTENSION_IMAGE}" 2>/dev/null || true

# Build the extension image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
echo -e "${BLUE}Command: docker build -t ${EXTENSION_IMAGE} .${NC}"

# Build with build args (single platform for local development)
docker build \
    --build-arg VERSION="${EXTENSION_VERSION}" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    -t "${EXTENSION_IMAGE}" \
    .

# Optional: Build multi-platform for production registry
if [[ "${MULTI_PLATFORM}" == "true" ]]; then
    echo -e "${YELLOW}🏗️  Building multi-platform image for production...${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --build-arg VERSION="${EXTENSION_VERSION}" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        -t "${EXTENSION_IMAGE}" \
        --push \
        .
fi

# Validate the extension structure
echo -e "${YELLOW}✅ Validating extension structure...${NC}"
validation_failed=false

# Check if UI directory exists in image
if ! docker run --rm "${EXTENSION_IMAGE}" sh -c "test -d /ui"; then
    echo -e "${RED}❌ UI directory not found in image${NC}"
    validation_failed=true
fi

# Check if backend directory exists in image
if ! docker run --rm "${EXTENSION_IMAGE}" sh -c "test -d /backend"; then
    echo -e "${RED}❌ Backend directory not found in image${NC}"
    validation_failed=true
fi

# Check metadata.json
if ! docker run --rm "${EXTENSION_IMAGE}" sh -c "test -f /metadata.json"; then
    echo -e "${RED}❌ metadata.json not found in image${NC}"
    validation_failed=true
fi

# Check icon.svg
if ! docker run --rm "${EXTENSION_IMAGE}" sh -c "test -f /icon.svg"; then
    echo -e "${RED}❌ icon.svg not found in image${NC}"
    validation_failed=true
fi

if [ "$validation_failed" = true ]; then
    echo -e "${RED}❌ Extension validation failed${NC}"
    exit 1
fi

# Create build info file
echo -e "${YELLOW}📋 Creating build info...${NC}"
cat > build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "${EXTENSION_VERSION}",
  "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "mode": "production",
  "dockerImage": "${EXTENSION_IMAGE}",
  "platform": "$(uname -m)",
  "nodeVersion": "$(node -v)",
  "dockerVersion": "$(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
}
EOF

# Test extension health (if possible)
echo -e "${YELLOW}🏥 Testing extension health...${NC}"
container_id=$(docker run -d -p 18080:8080 "${EXTENSION_IMAGE}")
sleep 5

health_check_passed=false
for i in {1..10}; do
    if curl -s http://localhost:18080/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Extension health check passed${NC}"
        health_check_passed=true
        break
    fi
    echo -e "${YELLOW}Waiting for extension to start... (${i}/10)${NC}"
    sleep 2
done

docker stop "${container_id}" > /dev/null 2>&1
docker rm "${container_id}" > /dev/null 2>&1

if [ "$health_check_passed" = false ]; then
    echo -e "${YELLOW}⚠️  Health check timeout (extension may still work in Docker Desktop)${NC}"
fi

# Tag for registry if prefix provided
if [[ -n "${REGISTRY_PREFIX}" ]]; then
    registry_image="${REGISTRY_PREFIX}/${EXTENSION_IMAGE}"
    echo -e "${YELLOW}🏷️  Tagging for registry: ${registry_image}${NC}"
    docker tag "${EXTENSION_IMAGE}" "${registry_image}"
fi

# Return to parent directory
cd ..

echo -e "${GREEN}✨ Extension build complete!${NC}"
echo ""
echo -e "${BLUE}📊 Build Summary:${NC}"
echo -e "${GREEN}  Extension Name: ${EXTENSION_NAME}${NC}"
echo -e "${GREEN}  Version: ${EXTENSION_VERSION}${NC}"
echo -e "${GREEN}  Image: ${EXTENSION_IMAGE}${NC}"
echo -e "${GREEN}  Size: $(docker images "${EXTENSION_IMAGE}" --format "table {{.Size}}" | tail -1)${NC}"
echo ""
echo -e "${BLUE}🚀 Installation Commands:${NC}"
echo -e "${GREEN}  Install in Docker Desktop:${NC}"
echo -e "    ${YELLOW}docker extension install ${EXTENSION_IMAGE}${NC}"
echo ""
echo -e "${GREEN}  Development mode (docker-compose):${NC}"
echo -e "    ${YELLOW}cd envoy-gateway-extension && docker-compose up -d${NC}"
echo ""
echo -e "${GREEN}  Manual container run:${NC}"
echo -e "    ${YELLOW}docker run -p 8080:8080 ${EXTENSION_IMAGE}${NC}"
echo ""

# Generate installation instructions
cat > INSTALL.md << EOF
# Envoy Gateway Docker Desktop Extension - Installation Guide

## System Requirements
- Docker Desktop 4.8.0 or later
- Kubernetes enabled in Docker Desktop
- 2GB+ available RAM for Kubernetes

## Installation Methods

### Method 1: Docker Desktop Extensions UI
1. Open Docker Desktop
2. Navigate to Extensions tab
3. Search for "Envoy Gateway" (if published)
4. Click Install

### Method 2: Command Line Installation
\`\`\`bash
docker extension install ${EXTENSION_IMAGE}
\`\`\`

### Method 3: Development Installation (Local Build)
\`\`\`bash
# Clone repository
git clone <repository-url>
cd envoy-gateway-docker-desktop-extension

# Build extension
./build-extension.sh

# Install
docker extension install ${EXTENSION_IMAGE}
\`\`\`

## Usage
1. Open Docker Desktop
2. Navigate to Extensions tab
3. Click on "Envoy Gateway"
4. Use the interface to manage Envoy Gateway resources

## Uninstallation
\`\`\`bash
docker extension uninstall ${EXTENSION_IMAGE}
\`\`\`

## Troubleshooting
- Ensure Docker Desktop has Kubernetes enabled
- Allocate sufficient resources to Docker Desktop
- Check extension logs: \`docker extension ls\`

## Version
Built: $(date)
Version: ${EXTENSION_VERSION}
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
EOF

echo -e "${GREEN}📖 Installation guide created: INSTALL.md${NC}"
echo -e "${BLUE}🎉 Ready for Docker Desktop marketplace submission!${NC}"