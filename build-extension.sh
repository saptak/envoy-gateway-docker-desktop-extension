#!/bin/bash

# Build script for Envoy Gateway Docker Desktop Extension

set -e

echo "🏗️  Building Envoy Gateway Docker Desktop Extension..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf envoy-gateway-extension/build
rm -rf envoy-gateway-extension/backend-dist
rm -rf envoy-gateway-extension/ui-dist

# Create build directories
mkdir -p envoy-gateway-extension/build
mkdir -p envoy-gateway-extension/backend-dist
mkdir -p envoy-gateway-extension/ui-dist

# Build backend
echo "🔧 Building backend..."
cd src/backend
npm ci --only=production
npm run build
cd ../..
cp -r src/backend/dist/* envoy-gateway-extension/backend-dist/
cp src/backend/package.json envoy-gateway-extension/backend-dist/
cp src/backend/package-lock.json envoy-gateway-extension/backend-dist/

# Build frontend
echo "⚛️  Building frontend..."
cd src/frontend
npm ci
npm run build
cd ../..
cp -r src/frontend/dist/* envoy-gateway-extension/ui-dist/

# Create optimized package.json for backend
echo "📦 Creating optimized package.json..."
cat > envoy-gateway-extension/backend-dist/package.json << 'EOF'
{
  "name": "envoy-gateway-extension-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@kubernetes/client-node": "^0.20.0",
    "axios": "^1.4.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dockerode": "^3.3.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "joi": "^17.9.2",
    "js-yaml": "^4.1.0",
    "lodash": "^4.17.21",
    "morgan": "^1.10.0",
    "socket.io": "^4.7.2",
    "uuid": "^9.0.0",
    "winston": "^3.10.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Copy metadata and assets
echo "📋 Copying metadata and assets..."
cp docker-extension.json envoy-gateway-extension/metadata.json
cp icon.svg envoy-gateway-extension/

echo "✅ Build complete! Extension is ready in envoy-gateway-extension/"

# Build Docker image
echo "🐳 Building Docker image..."
cd envoy-gateway-extension
docker build -t envoy-gateway-extension:latest .
cd ..

echo "🎉 Build successful! Run 'docker extension install envoy-gateway-extension:latest' to install."