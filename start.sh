#!/bin/sh
set -e

echo "Starting Envoy Gateway Docker Desktop Extension..."

# Start backend
cd /app/backend
node index.js &
BACKEND_PID=$!

# Serve frontend static files
cd /app/frontend
npx serve -s dist -l ${FRONTEND_PORT} &
FRONTEND_PID=$!

# Function to handle shutdown
shutdown() {
  echo "Shutting down services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}

# Handle signals
trap 'shutdown' SIGTERM SIGINT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
