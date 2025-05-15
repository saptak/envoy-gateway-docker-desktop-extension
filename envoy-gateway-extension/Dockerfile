FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache curl bash

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --only=production

# Copy backend source
COPY backend/src ./src

# Copy UI files
WORKDIR /app
COPY ui ./ui

# Copy extension metadata to root for Docker Desktop
COPY metadata.json /metadata.json
COPY icon.svg /icon.svg

# Create simple startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node src/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 8080

# Add Docker Desktop Extension labels
LABEL org.opencontainers.image.title="Envoy Gateway"
LABEL org.opencontainers.image.description="Docker Desktop extension for Envoy Gateway management"
LABEL org.opencontainers.image.vendor="Envoy Gateway Community"
LABEL com.docker.desktop.extension.api.version="0.3.4"
LABEL com.docker.extension.screenshots='[]'
LABEL com.docker.extension.detailed-description="A Docker Desktop extension for managing Envoy Gateway resources with namespace support"
LABEL com.docker.extension.publisher-url="https://gateway.envoyproxy.io"
LABEL com.docker.extension.additional-urls='[]'
LABEL com.docker.extension.categories="networking,kubernetes"
LABEL com.docker.extension.changelog="Initial release with namespace selector"

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["/app/start.sh"]