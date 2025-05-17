#!/bin/sh

# Start backend service
echo "Starting Envoy Gateway backend..."
cd /backend
node dist/index.js &
BACKEND_PID=$!

# Wait for the backend to start
echo "Waiting for backend to start..."
sleep 5

# Keep container running
echo "Envoy Gateway Extension ready"
tail -f /dev/null
