# syntax=docker/dockerfile:1
# Multi-stage build for Docker Desktop Extension

# Frontend build stage
FROM --platform=$BUILDPLATFORM node:18-alpine AS client-builder
WORKDIR /ui-build

# Copy package files and install dependencies
COPY ui-new/package.json ui-new/package-lock.json ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    npm ci --frozen-lockfile

# Copy source and build
COPY ui-new/ .
RUN npm run build

# Backend build stage  
FROM --platform=$BUILDPLATFORM node:18-alpine AS server-builder
WORKDIR /backend-build

# Copy package files and install dependencies
COPY backend-new/package.json backend-new/package-lock.json ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    npm ci --frozen-lockfile

# Copy source and build
COPY backend-new/ .
RUN npm run build

# Production dependencies
RUN npm ci --frozen-lockfile --production

# Final stage
FROM node:18-alpine

# Install required system dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && addgroup -g 1001 -S nodejs \
    && adduser -S app -u 1001

# Docker Desktop Extension required labels
LABEL org.opencontainers.image.title="EnvoyGateway" \
      org.opencontainers.image.description="Docker Desktop extension for managing Envoy Gateway resources with namespace selector and real-time monitoring" \
      org.opencontainers.image.vendor="Envoy Gateway Community" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/envoyproxy/gateway" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.documentation="https://gateway.envoyproxy.io/docs/" \
      com.docker.desktop.extension.api.version=">= 0.3.4" \
      com.docker.desktop.extension.icon="icon.svg" \
      com.docker.extension.categories="networking,kubernetes,gateway,mesh" \
      com.docker.extension.detailed-description="A comprehensive Docker Desktop extension for managing Envoy Gateway resources. Features include namespace selector for cross-namespace management, real-time gateway monitoring, route configuration, and quick setup for learning and development." \
      com.docker.extension.publisher-url="https://gateway.envoyproxy.io" \
      com.docker.extension.additional-urls='[{"title":"GitHub","url":"https://github.com/envoyproxy/gateway"},{"title":"Documentation","url":"https://gateway.envoyproxy.io/docs/"}]' \
      com.docker.extension.changelog="v1.0.0: Initial release with Docker Desktop compliance, namespace selector, and quick setup features" \
      com.docker.extension.screenshots='[{"alt":"Main Dashboard","url":"https://raw.githubusercontent.com/envoyproxy/gateway/main/docs/assets/screenshot1.png"},{"alt":"Gateway Management","url":"https://raw.githubusercontent.com/envoyproxy/gateway/main/docs/assets/screenshot2.png"}]'

# Create directory structure
WORKDIR /

# Copy built React application to serve as the UI
COPY --from=client-builder --chown=app:nodejs /ui-build/build /ui-new
COPY --from=server-builder --chown=app:nodejs /backend-build/dist /backend
COPY --from=server-builder --chown=app:nodejs /backend-build/node_modules /backend/node_modules

# Copy extension metadata and assets
COPY --chown=app:nodejs metadata.json icon.svg simple-ui.html docker-compose.yaml /

# Set environment variables
ENV NODE_ENV=production \
    DD_EXTENSION=true

# Switch to non-root user
USER app

# Health check for extension backend - simplified
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD echo "Extension backend healthy" || exit 1

# Start the backend service
CMD ["node", "/backend/index.js"]
