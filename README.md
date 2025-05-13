# Envoy Gateway Docker Desktop Extension

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/envoyproxy/gateway-docker-extension)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-4.8+-blue.svg)](https://www.docker.com/products/docker-desktop)

A Docker Desktop extension that simplifies Envoy Gateway development, testing, and management with an intuitive graphical interface.

![Envoy Gateway Extension Screenshot](docs/assets/screenshot-dashboard.png)

## 🚀 Features

### 🔧 One-Click Setup
- Deploy Envoy Gateway instances with zero configuration
- Automatic Kubernetes cluster setup in Docker Desktop
- Pre-configured gateway templates for common use cases

### 📊 Visual Management
- Drag-and-drop gateway configuration builder
- Real-time configuration validation
- Visual representation of traffic flows and routes

### 🔍 Integrated Testing
- Built-in HTTP client for API testing
- Traffic simulation and load testing
- Request/response inspection and debugging

### 📈 Monitoring Dashboard
- Real-time metrics and performance monitoring
- Traffic visualization and analytics
- Health checks and status monitoring

### 🛠️ Developer Tools
- YAML/JSON configuration editor with syntax highlighting
- Git integration for configuration versioning
- Export/import configuration templates

## 📋 Requirements

- Docker Desktop 4.8+
- Kubernetes enabled in Docker Desktop
- 4GB+ RAM available to Docker

## 🛠️ Installation

### From Docker Hub (Recommended)

1. Open Docker Desktop
2. Navigate to **Extensions** → **Browse**
3. Search for "Envoy Gateway"
4. Click **Install**

### From Release

1. Download the latest `.tar.gz` from [Releases](https://github.com/envoyproxy/gateway-docker-extension/releases)
2. Open Docker Desktop
3. Navigate to **Extensions** → **Add Extension**
4. Select **Install from local file**
5. Choose the downloaded file

### From Source

```bash
# Clone the repository
git clone https://github.com/envoyproxy/gateway-docker-extension.git
cd envoy-gateway-docker-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Install in Docker Desktop
docker extension install .
```

## 🎯 Quick Start

### 1. Deploy Your First Gateway

1. Open the Envoy Gateway extension in Docker Desktop
2. Click **"Create New Gateway"**
3. Choose a template (e.g., "Basic HTTP Gateway")
4. Click **"Deploy"**

Your gateway will be running at `http://localhost:8080`

### 2. Configure Routes

1. Navigate to the **"Routes"** tab
2. Click **"Add Route"**
3. Set the path pattern (e.g., `/api/v1/*`)
4. Configure the backend service
5. Click **"Apply"**

### 3. Test Your APIs

1. Open the **"Testing"** tab
2. Enter your API endpoint
3. Configure headers and body
4. Click **"Send Request"**
5. Inspect the response and metrics

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md) - Comprehensive usage instructions
- [Configuration Reference](docs/CONFIGURATION.md) - Gateway configuration options
- [API Reference](docs/API_REFERENCE.md) - Extension API documentation
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing](docs/CONTRIBUTING.md) - How to contribute to the project

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Docker Desktop                │
│  ┌─────────────────────────────────────┐ │
│  │     Extension Frontend (React)      │ │
│  │  ┌─────────────┬─────────────────┐  │ │
│  │  │  Dashboard  │   Configuration │  │ │
│  │  │             │     Builder     │  │ │
│  │  ├─────────────┼─────────────────┤  │ │
│  │  │   Testing   │    Monitoring   │  │ │
│  │  │    Tools    │     Dashboard   │  │ │
│  │  └─────────────┴─────────────────┘  │ │
│  └─────────────────┬───────────────────┘ │
│                    │ REST API            │
│  ┌─────────────────┴───────────────────┐ │
│  │         Backend Service             │ │
│  │    (Node.js + Express)             │ │
│  └─────────────────┬───────────────────┘ │
│                    │ Docker API          │
│  ┌─────────────────┴───────────────────┐ │
│  │        Docker Containers            │ │
│  │  ┌─────────┬─────────┬─────────────┐ │ │
│  │  │  Envoy  │Gateway  │   Test      │ │ │
│  │  │ Gateway │ Config  │  Backend    │ │ │
│  │  └─────────┴─────────┴─────────────┘ │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/envoyproxy/gateway-docker-extension.git
cd envoy-gateway-docker-extension
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for distribution
npm run build
```

## 📊 Roadmap

### Phase 1: Core Features ✅
- [x] Basic gateway deployment
- [x] Simple route configuration
- [x] Basic monitoring dashboard

### Phase 2: Enhanced UX (Q2 2024)
- [ ] Visual configuration builder
- [ ] Advanced testing tools
- [ ] Performance benchmarking

### Phase 3: Advanced Features (Q3 2024)
- [ ] Multi-cluster support
- [ ] Custom plugin development
- [ ] GitOps integration

### Phase 4: Enterprise Features (Q4 2024)
- [ ] RBAC and security policies
- [ ] Advanced observability
- [ ] Professional support

## 🔒 Security

For security concerns, please email security@envoyproxy.io rather than opening a public issue.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Envoy Proxy](https://www.envoyproxy.io/) team for the amazing proxy
- [Docker Desktop](https://www.docker.com/products/docker-desktop) team for the extension platform
- [Gateway API](https://gateway-api.sigs.k8s.io/) community for the standards

## 📞 Support

- 📖 [Documentation](docs/)
- 💬 [GitHub Discussions](https://github.com/envoyproxy/gateway-docker-extension/discussions)
- 🐛 [Issues](https://github.com/envoyproxy/gateway-docker-extension/issues)
- 📧 [Mailing List](mailto:envoy-gateway-dev@lists.envoyproxy.io)

---

Made with ❤️ by the Envoy Gateway community
