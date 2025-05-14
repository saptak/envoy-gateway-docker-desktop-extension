# Multi-stage Docker build for Envoy Gateway Docker Desktop Extension

# Build stage for backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY src/backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY src/backend ./
RUN npm run build

# Build stage for frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY src/frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY src/frontend ./
RUN npm run build

# Final runtime stage
FROM node:18-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy backend build
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/dist ./frontend/dist

# Copy shared types if they exist
COPY --chown=nextjs:nodejs src/shared ./shared

# Copy docker-compose file
COPY --chown=nextjs:nodejs docker-compose.yml ./

# Set up environment
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_PORT=3000

# Create startup script
RUN cat > start.sh << 'EOF'
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
EOF

RUN chmod +x start.sh

# Install serve for frontend
RUN npm install -g serve

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3001 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["./start.sh"]

# Labels
LABEL \
  org.opencontainers.image.title="Envoy Gateway Docker Desktop Extension" \
  org.opencontainers.image.description="Modern interface for managing Envoy Gateway resources" \
  org.opencontainers.image.vendor="Envoy Gateway Community" \
  org.opencontainers.image.version="1.0.0" \
  org.opencontainers.image.licenses="Apache-2.0" \
  com.docker.extension.api.version=">= 0.2.0" \
  com.docker.extension.categories="kubernetes,networking,gateway" \
  com.docker.extension.detailed-description="A comprehensive Docker Desktop extension for managing Envoy Gateway resources including gateways, routes, and monitoring with real-time updates and intuitive UI."