# Envoy Gateway Docker Desktop Extension

## Overview

The Envoy Gateway Docker Desktop Extension provides a user-friendly interface for managing Envoy Gateway resources directly within Docker Desktop. This extension simplifies the deployment, configuration, and monitoring of Envoy Gateway on your local Kubernetes cluster.

## Features

- **Easy Installation**: One-click Envoy Gateway deployment to your Docker Desktop Kubernetes cluster
- **Real-time Monitoring**: Live dashboard showing gateway status, routes, and metrics
- **Namespace Selector**: Manage Envoy Gateway resources across different namespaces
- **Route Management**: Visual interface for creating and managing HTTP routes
- **Quick Setup**: Streamlined workflow for learning and development scenarios
- **Health Monitoring**: Comprehensive health checks and status indicators

## Requirements

- Docker Desktop 4.8.0 or later
- Kubernetes enabled in Docker Desktop
- Minimum 2GB RAM allocated to Docker Desktop
- Administrative privileges for extension installation

## Installation

### Via Docker Desktop Extensions UI
1. Open Docker Desktop
2. Navigate to the **Extensions** tab
3. Search for "Envoy Gateway"
4. Click **Install**

### Via Command Line
```bash
docker extension install envoy-gateway-extension:latest
```

### From Source (Development)
```bash
git clone <repository-url>
cd envoy-gateway-docker-desktop-extension
./build-extension.sh
docker extension install envoy-gateway-extension:latest
```

## Quick Start

1. **Enable Kubernetes** in Docker Desktop (Settings → Kubernetes → Enable Kubernetes)
2. **Install the Extension** using one of the methods above
3. **Open the Extension** from the Extensions tab
4. **Deploy Envoy Gateway** using the "Quick Deploy" button
5. **Create your first Gateway** using the guided setup

## Usage Guide

### Dashboard Overview
The main dashboard provides:
- Real-time status indicators
- Resource overview (Gateways, Routes, Services)
- Activity logs
- Quick action buttons

### Managing Gateways
- View all gateways in the selected namespace
- Create new gateways with pre-configured templates
- Monitor gateway health and traffic metrics
- Edit gateway configurations

### Route Management
- Create HTTP routes for your applications
- Test routes directly from the interface
- View route performance metrics
- Manage route priorities and backends

### Monitoring and Troubleshooting
- Real-time logs and events
- Health check status
- Resource utilization metrics
- Troubleshooting guides and tips

## Configuration

The extension automatically detects your Docker Desktop Kubernetes configuration. Advanced users can customize:

- Default namespace settings
- Monitoring intervals
- Display preferences
- Network policies

## Architecture

The extension consists of:
- **Frontend**: React-based user interface
- **Backend**: Node.js API service
- **Integration**: Kubernetes API client for resource management

## Support

For issues and questions:
- Check the [Troubleshooting Guide](troubleshooting.md)
- Visit [Envoy Gateway Documentation](https://gateway.envoyproxy.io/)
- Report issues on [GitHub](https://github.com/envoyproxy/gateway/issues)

## License

This extension is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

**Version**: 1.0.0  
**Last Updated**: $(date +'%Y-%m-%d')  
**Compatibility**: Docker Desktop 4.8+, Kubernetes 1.20+