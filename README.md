# Envoy Gateway Docker Desktop Extension

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Extension](https://img.shields.io/badge/Docker%20Desktop-Extension-brightgreen)](https://docs.docker.com/desktop/extensions/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Compatible-blue)](https://kubernetes.io/)

A Docker Desktop extension that provides an intuitive interface for managing [Envoy Gateway](https://gateway.envoyproxy.io/) resources directly within Docker Desktop.

## 🌟 Features

- **🚀 One-Click Deployment**: Deploy Envoy Gateway to your local Kubernetes cluster instantly
- **📊 Real-Time Monitoring**: Live dashboard with metrics, health status, and activity logs
- **🗂️ Namespace Management**: Switch between namespaces and manage resources across your cluster
- **🛣️ Route Management**: Visual interface for creating and configuring HTTP/HTTPS routes
- **🔧 Gateway Configuration**: Easy setup and modification of gateway listeners and settings
- **🧪 Route Testing**: Built-in testing tools to validate your configurations
- **📈 Observability**: Comprehensive monitoring with metrics and logging
- **💡 Quick Setup**: Streamlined workflow perfect for learning and development

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Docker Desktop                │
├─────────────────────────────────────────┤
│  Extension Frontend (React)             │
│  ├─ Dashboard                          │
│  ├─ Gateway Management                 │
│  ├─ Route Configuration                │
│  └─ Monitoring                         │
├─────────────────────────────────────────┤
│  Extension Backend (Node.js/TypeScript) │
│  ├─ Kubernetes API Client              │
│  ├─ WebSocket Server                   │
│  └─ REST API                           │
├─────────────────────────────────────────┤
│  Docker Desktop Kubernetes             │
│  └─ Envoy Gateway                      │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Docker Desktop** 4.8.0 or later
- **Kubernetes** enabled in Docker Desktop
- **Memory**: Minimum 2GB allocated to Docker Desktop
- **Network**: Unrestricted access to container registries

## 🚀 Installation

### Option 1: Docker Desktop Extensions Marketplace

1. Open Docker Desktop
2. Navigate to **Extensions** tab
3. Search for "Envoy Gateway"
4. Click **Install**

### Option 2: Command Line Installation

```bash
docker extension install envoy-gateway-extension:latest
```

### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/your-username/envoy-gateway-docker-desktop-extension.git
cd envoy-gateway-docker-desktop-extension

# Build the extension
./build-extension.sh

# Install locally
docker extension install envoy-gateway-extension:latest
```

## 🏃‍♂️ Quick Start

1. **Enable Kubernetes** in Docker Desktop if not already enabled:
   - Go to Settings → Kubernetes → Enable Kubernetes

2. **Launch the Extension**:
   - Open Docker Desktop
   - Click on Extensions tab
   - Click on "Envoy Gateway" to launch

3. **Deploy Envoy Gateway**:
   - Click the "Deploy Envoy Gateway" button in the dashboard
   - Wait for deployment completion (typically 1-2 minutes)

4. **Create Your First Gateway**:
   - Navigate to the Gateways tab
   - Click "Create Gateway"
   - Follow the guided setup

5. **Configure Routes**:
   - Go to the Routes tab
   - Create HTTP routes pointing to your services
   - Test routes using the built-in testing tools

## 📚 Documentation

- **[User Guide](docs/user-guide.md)** - Comprehensive usage instructions
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- **[API Reference](docs/api-reference.md)** - Backend API documentation
- **[Examples](docs/examples.md)** - Real-world usage examples

## 🔧 Development

### Project Structure

```
envoy-gateway-docker-desktop-extension/
├── envoy-gateway-extension/           # Extension source code
│   ├── backend-new/                   # TypeScript backend service
│   ├── ui-new/                        # React frontend application
│   ├── Dockerfile                     # Multi-stage build configuration
│   ├── metadata.json                  # Extension metadata
│   └── docker-compose.yaml            # Development composition
├── docs/                              # Documentation
├── build-extension.sh                 # Build script
└── README.md                          # This file
```

### Local Development

```bash
# Clone and setup
git clone <repository-url>
cd envoy-gateway-docker-desktop-extension

# Install dependencies
cd envoy-gateway-extension/backend-new && npm install
cd ../ui-new && npm install

# Start development servers
cd ../backend-new && npm run dev        # Backend on :8080
cd ../ui-new && npm start              # Frontend on :3000

# Build and test extension
cd ../../ && ./build-extension.sh
docker extension install envoy-gateway-extension:latest
```

### Testing

```bash
# Backend tests
cd envoy-gateway-extension/backend-new
npm test                    # Run test suite
npm run test:coverage       # Generate coverage report

# Frontend tests
cd ../ui-new
npm test                    # Run React tests
npm run test:e2e           # End-to-end tests
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/envoyproxy/gateway/issues)
- **Discussions**: [GitHub Discussions](https://github.com/envoyproxy/gateway/discussions)
- **Documentation**: [Envoy Gateway Docs](https://gateway.envoyproxy.io/)
- **Community**: [Envoy Slack #envoy-gateway](https://envoyproxy.slack.com/)

## 🏆 Acknowledgments

- [Envoy Proxy](https://www.envoyproxy.io/) for the amazing proxy technology
- [Envoy Gateway](https://gateway.envoyproxy.io/) for the gateway implementation
- [Docker](https://www.docker.com/) for the Desktop Extension framework
- [CNCF](https://www.cncf.io/) for supporting the cloud-native ecosystem

## 📊 Project Status

- ✅ **Backend API**: Complete with TypeScript and 91% test coverage
- ✅ **Frontend UI**: Modern React application with responsive design
- ✅ **Extension Packaging**: Docker Desktop compliant with metadata
- ✅ **Integration Testing**: Validated on Docker Desktop Kubernetes
- ✅ **Documentation**: Comprehensive user and developer guides
- 🔄 **Marketplace Ready**: Prepared for Docker Desktop marketplace submission

---

<p align="center">
  Made with ❤️ by the Envoy Gateway community
</p>

<p align="center">
  <a href="https://gateway.envoyproxy.io/">Website</a> •
  <a href="https://github.com/envoyproxy/gateway">Source</a> •
  <a href="https://gateway.envoyproxy.io/docs/">Documentation</a> •
  <a href="https://twitter.com/EnvoyProxy">Twitter</a>
</p>