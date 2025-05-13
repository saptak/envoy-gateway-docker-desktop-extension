#!/bin/bash

# Envoy Gateway Docker Desktop Extension Startup Script

set -e

echo "Starting Envoy Gateway Docker Desktop Extension..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8080}
export LOG_LEVEL=${LOG_LEVEL:-info}

# Create necessary directories
mkdir -p /tmp/envoy-gateway-extension
mkdir -p /host/dist/backend

# Copy backend binary to host directory
cp /backend/* /host/dist/backend/ 2>/dev/null || true

# Start the backend service
echo "Starting backend service on port $PORT..."
cd /backend
exec node index.js

# Keep the container running
tail -f /dev/null
