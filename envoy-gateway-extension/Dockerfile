FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bash

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --only=production

# Copy backend source
COPY backend/src ./src

# Copy frontend
WORKDIR /app
COPY ui ./ui

# Copy metadata.json, docker-compose.yaml and icon to root - CRITICAL for Docker Desktop Extension
COPY metadata.json /metadata.json
COPY docker-compose.yaml /docker-compose.yaml
COPY icon.svg /icon.svg

# Copy UI to root directory as well for Docker Desktop to find it
COPY ui /ui

# Copy to app directory for access
COPY icon.svg .
COPY metadata.json .
COPY docker-compose.yaml .

# Create startup script that only runs the backend
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node src/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 8080

# Add Docker extension labels
LABEL org.opencontainers.image.title="Envoy Gateway"
LABEL org.opencontainers.image.description="Docker Desktop extension for Envoy Gateway management"
LABEL org.opencontainers.image.vendor="Envoy Gateway Community"
LABEL com.docker.desktop.extension.api.version="0.3.4"

CMD ["/app/start.sh"]
