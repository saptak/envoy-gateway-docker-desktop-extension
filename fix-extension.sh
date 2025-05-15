#!/bin/bash

# Fix and Reinstall Envoy Gateway Extension

echo "🔧 Fixing and reinstalling Envoy Gateway Extension..."

# Navigate to extension directory
cd "/Users/saptak/code/envoy-gateway-docker-desktop-extension/envoy-gateway-extension"

# Uninstall any existing extension
echo "🗑️ Removing existing extension..."
docker extension uninstall envoy-gateway-extension 2>/dev/null || true

# Rebuild the Docker image with latest tag
echo "🔨 Rebuilding Docker image..."
docker build -t envoy-gateway-extension:latest .

# Install the extension
echo "📦 Installing extension..."
docker extension install --force envoy-gateway-extension:latest

# Verify installation
echo "✅ Verifying installation..."
docker extension ls

echo "🎉 Done! The extension should now appear in Docker Desktop."
