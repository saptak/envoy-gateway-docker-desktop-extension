FROM alpine:latest

LABEL org.opencontainers.image.title="EnvoyGateway" \
      org.opencontainers.image.description="Docker Desktop extension for managing Envoy Gateway resources" \
      org.opencontainers.image.vendor="Envoy Gateway Community" \
      com.docker.desktop.extension.api.version=">= 0.3.4" \
      com.docker.desktop.extension.icon="icon.svg" \
      com.docker.extension.categories="networking,kubernetes"

COPY . /ui
COPY icon.svg /icon.svg
COPY metadata.json /metadata.json
COPY docker-compose.yaml /docker-compose.yaml
