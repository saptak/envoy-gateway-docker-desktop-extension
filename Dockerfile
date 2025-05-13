# Multi-stage Dockerfile for Docker Desktop Extension

# Stage 1: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /backend

# Copy backend package files
COPY package*.json ./
COPY src/backend/package.json src/backend/
COPY src/backend/tsconfig.json src/backend/

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY src/backend/ src/backend/

# Build backend
RUN npm run build:backend

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY src/frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY src/frontend/ .

# Build frontend
RUN npm run build

# Stage 3: Final Extension Image
FROM docker/extension-base:alpine

LABEL org.opencontainers.image.title="Envoy Gateway" \
    org.opencontainers.image.description="Docker Desktop extension for Envoy Gateway development and management" \
    org.opencontainers.image.vendor="Envoy Gateway Community" \
    org.opencontainers.image.version="1.0.0" \
    org.opencontainers.image.url="https://github.com/envoyproxy/gateway-docker-extension" \
    org.opencontainers.image.source="https://github.com/envoyproxy/gateway-docker-extension" \
    org.opencontainers.image.licenses="Apache-2.0"

# Copy built frontend
COPY --from=frontend-builder /frontend/dist /ui

# Copy built backend
COPY --from=backend-builder /backend/dist/backend /backend

# Copy metadata and scripts
COPY docker-extension.json .
COPY docker.svg .

# Copy startup scripts
COPY scripts/start.sh /start.sh
RUN chmod +x /start.sh

# Create necessary directories
RUN mkdir -p /host/dist/backend

# Set up environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["/start.sh"]
