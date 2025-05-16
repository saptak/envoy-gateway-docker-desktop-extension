# Envoy Gateway Docker Desktop Extension - Installation Guide

## System Requirements
- Docker Desktop 4.8.0 or later
- Kubernetes enabled in Docker Desktop
- 2GB+ available RAM for Kubernetes

## Installation Methods

### Method 1: Docker Desktop Extensions UI
1. Open Docker Desktop
2. Navigate to Extensions tab
3. Search for "Envoy Gateway" (if published)
4. Click Install

### Method 2: Command Line Installation
```bash
docker extension install envoy-gateway-extension:latest
```

### Method 3: Development Installation (Local Build)
```bash
# Clone repository
git clone <repository-url>
cd envoy-gateway-docker-desktop-extension

# Build extension
./build-extension.sh

# Install
docker extension install envoy-gateway-extension:latest
```

## Usage
1. Open Docker Desktop
2. Navigate to Extensions tab
3. Click on "Envoy Gateway"
4. Use the interface to manage Envoy Gateway resources

## Uninstallation
```bash
docker extension uninstall envoy-gateway-extension:latest
```

## Troubleshooting
- Ensure Docker Desktop has Kubernetes enabled
- Allocate sufficient resources to Docker Desktop
- Check extension logs: `docker extension ls`

## Version
Built: Fri May 16 14:20:12 PDT 2025
Version: 1.0.0
Commit: 35e7b41
