#!/bin/bash

# Envoy Gateway Extension - Complete Build and Integration Script
# This script builds the complete frontend and backend and integrates into Docker Desktop Extension

set -e

echo "🚀 Starting Envoy Gateway Extension Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/saptak/code/envoy-gateway-docker-desktop-extension"
EXTENSION_DIR="$PROJECT_ROOT/envoy-gateway-extension"

echo -e "${YELLOW}📁 Cleaning previous builds...${NC}"
cd "$PROJECT_ROOT"
npm run clean

# Build backend
echo -e "${YELLOW}🔧 Building backend...${NC}"
cd "$PROJECT_ROOT"
npm run build:backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed!${NC}"
    exit 1
fi

# Install frontend dependencies and build
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd "$PROJECT_ROOT/src/frontend"
npm install

echo -e "${YELLOW}🎨 Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

# Create extension directory structure
echo -e "${YELLOW}📁 Setting up extension directory...${NC}"
cd "$PROJECT_ROOT"
rm -rf "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR/backend"
mkdir -p "$EXTENSION_DIR/frontend"

# Copy built backend
echo -e "${YELLOW}📋 Copying backend build...${NC}"
cp -r dist/backend/* "$EXTENSION_DIR/backend/"
cp src/backend/package.json "$EXTENSION_DIR/backend/"
cp src/backend/package-lock.json "$EXTENSION_DIR/backend/" 2>/dev/null || echo "No backend package-lock.json found"

# Copy built frontend
echo -e "${YELLOW}📋 Copying frontend build...${NC}"
cp -r src/frontend/dist/* "$EXTENSION_DIR/frontend/"

# Copy essential files
echo -e "${YELLOW}📋 Copying extension essentials...${NC}"
cp icon.svg "$EXTENSION_DIR/"

# Create optimized Dockerfile for the extension
echo -e "${YELLOW}🐳 Creating Docker configuration...${NC}"
cat > "$EXTENSION_DIR/Dockerfile" << 'EOF'
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    && npm install -g serve

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy application files
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create start script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'cd /app/backend && node index.js &' >> start.sh && \
    echo 'serve -s /app/frontend -l 80' >> start.sh && \
    chmod +x start.sh

EXPOSE 80 8080

# Add Docker extension labels
LABEL org.opencontainers.image.title="Envoy Gateway"
LABEL org.opencontainers.image.description="Docker Desktop extension for Envoy Gateway management"
LABEL org.opencontainers.image.vendor="Envoy Gateway Community"
LABEL com.docker.desktop.extension.api.version="0.3.4"
LABEL com.docker.desktop.extension.icon="data:image/svg+xml;base64,$(base64 -w 0 /app/icon.svg)"

CMD ["./start.sh"]
EOF

# Create metadata.json for the extension
echo -e "${YELLOW}📝 Creating extension metadata...${NC}"
cat > "$EXTENSION_DIR/metadata.json" << 'EOF'
{
  "icon": "icon.svg",
  "vm": {
    "image": "envoy-gateway-extension:latest"
  },
  "ui": {
    "dashboard-tab": {
      "title": "Envoy Gateway",
      "src": "/index.html",
      "root": "frontend"
    }
  },
  "host": {
    "binaries": []
  }
}
EOF

# Build the Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
cd "$EXTENSION_DIR"
docker build -t envoy-gateway-extension:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Optional: Install the extension
read -p "Would you like to install the extension now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔄 Uninstalling existing extension...${NC}"
    docker extension uninstall envoy-gateway-extension 2>/dev/null || true
    
    echo -e "${YELLOW}📦 Installing new extension...${NC}"
    docker extension install envoy-gateway-extension:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Extension installed successfully!${NC}"
        echo -e "${GREEN}🎉 You can now access Envoy Gateway from the Docker Desktop Extensions tab${NC}"
    else
        echo -e "${RED}❌ Extension installation failed!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}🎉 Script completed successfully!${NC}"
