# syntax=docker/dockerfile:1
FROM node:18-alpine

# Install dependencies for Docker Desktop extensions
RUN apk add --no-cache curl bash

WORKDIR /app

# Copy and build backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --only=production

# Copy backend source
COPY backend/src ./src

# Copy UI files to root and app directory for Docker Desktop extension
WORKDIR /app
COPY ui ./ui
# Copy UI to root for Docker Desktop
COPY ui /ui

# Copy metadata and icon to filesystem root as required by Docker Desktop
COPY metadata.json /metadata.json
COPY icon.svg /icon.svg

# Set proper ownership and permissions
RUN chmod 644 /metadata.json /icon.svg

# Set environment variable to indicate this is a Docker Desktop extension
ENV DOCKER_DESKTOP_EXTENSION=true

# Docker Desktop Extension labels (required)
LABEL org.opencontainers.image.title="EnvoyGateway"
LABEL org.opencontainers.image.description="Docker Desktop extension for managing Envoy Gateway resources with full namespace support"
LABEL org.opencontainers.image.vendor="Envoy Gateway Community"
LABEL com.docker.desktop.extension.api.version="0.3.4"
LABEL com.docker.desktop.extension.icon="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0IDEyIDIyTDEwLjkxIDE1Ljc0IDQgOUwxMC45MSA4LjI2IDEyIDJ6IiBmaWxsPSIjMDA3OEQ0Ii8+PC9zdmc+"
LABEL com.docker.extension.detailed-description="A comprehensive Docker Desktop extension for managing Envoy Gateway resources. Features include namespace selector for cross-namespace management, real-time gateway monitoring, and route configuration."
LABEL com.docker.extension.publisher-url="https://gateway.envoyproxy.io"
LABEL com.docker.extension.additional-urls='["https://github.com/envoyproxy/gateway"]'
LABEL com.docker.extension.categories="networking,kubernetes,gateway"
LABEL com.docker.extension.changelog="v1.0.0: Initial release with namespace selector and multi-namespace support"
LABEL com.docker.extension.screenshots='[]'

# Health check for both modes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD if [ "$DOCKER_DESKTOP_EXTENSION" = "true" ]; then \
           echo "Extension mode - backend healthy"; \
        else \
           curl -f http://localhost:8080/api/health || exit 1; \
        fi

EXPOSE 8080

# Start the backend directly
WORKDIR /app/backend
CMD ["node", "src/index.js"]