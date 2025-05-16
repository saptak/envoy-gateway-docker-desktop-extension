# Envoy Gateway Docker Desktop Extension with Namespace Selector

A clean, minimal Docker Desktop extension for managing Envoy Gateway resources with **complete namespace support** including cross-namespace functionality.

## ✨ Features

### 🎯 **Namespace Selector Implementation**
- **Dropdown selector** prominently displayed on main page
- **Cross-namespace support** with "All Namespaces" option
- **Real-time filtering** of gateways and routes by namespace
- **Resource count display** per namespace in status bar
- **Smooth namespace switching** with instant updates

### 🚀 **Core Functionality**
- **Gateway Management**: Create, configure, and monitor Envoy Gateways
- **Route Configuration**: Design HTTPRoutes with visual tools
- **Real-time Monitoring**: Live dashboards and metrics
- **Docker Integration**: Seamless container lifecycle management
- **Kubernetes Native**: Full cluster integration with context support

## 🔧 **Quick Start**

### Prerequisites
- Docker Desktop installed
- Kubernetes cluster running (optional for demo mode)

### Run the Extension

```bash
# Clone the repository
git clone https://github.com/saptak/envoy-gateway-docker-desktop-extension.git
cd envoy-gateway-docker-desktop-extension

# Start the extension
docker-compose up -d

# Access the extension
open http://localhost:8080
```

## 🌐 **Namespace Selector Usage**

1. **Access Interface**: Navigate to http://localhost:8080
2. **Select Namespace**: Use the dropdown at the top of the page
3. **Filter Resources**: Gateways and routes automatically filter by selection
4. **Cross-Namespace View**: Choose "All Namespaces" to see all resources
5. **Real-time Updates**: Resources refresh every 30 seconds

## 📦 **Installation Options**

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Option 2: Direct Docker Run
```bash
docker run -d -p 8080:8080 \
  -v ~/.kube/config:/root/.kube/config:ro \
  --name envoy-gateway-extension \
  envoy-gateway-extension:latest
```

### Option 3: Build from Source
```bash
# Build the extension
cd envoy-gateway-extension
docker build -t envoy-gateway-extension:latest .

# Run the container
docker run -d -p 8080:8080 envoy-gateway-extension:latest
```

## 🏗️ **Clean Architecture**

This project has been **refactored to remove all redundant code** while maintaining full functionality:

### Project Structure
```
envoy-gateway-docker-desktop-extension/
├── envoy-gateway-extension/          # Complete working extension
│   ├── backend/                      # Node.js backend
│   │   ├── package.json             # Dependencies
│   │   └── src/index.js             # Main backend with namespace APIs
│   ├── ui/                          # HTML frontend
│   │   └── index.html               # UI with namespace selector
│   ├── Dockerfile                    # Container image
│   ├── metadata.json                 # Extension metadata
│   └── icon.svg                      # Extension icon
├── docker-compose.yml               # Quick start configuration
├── README.md                         # This file
└── .gitignore                        # Git ignore rules
```

### Key Implementation
- **Frontend**: `envoy-gateway-extension/ui/index.html` - Complete HTML UI with namespace selector
- **Backend**: `envoy-gateway-extension/backend/src/index.js` - Node.js server with namespace APIs
- **Container**: `envoy-gateway-extension/Dockerfile` - Containerized extension

## 🔧 **APIs**

- `/api/health` - System health check
- `/api/kubernetes/namespaces` - Get all namespaces
- `/api/gateways` - Gateway resources (with namespace filtering)
- `/api/routes` - Route resources (with namespace filtering)

## 🎯 **Features Implemented**

✅ **All requirements successfully implemented:**
- [x] Namespace selector on main page
- [x] Cross-namespace functionality
- [x] Real-time resource filtering
- [x] Excellent developer experience
- [x] Clean, maintainable codebase
- [x] No redundant code

## 📝 **Code Quality**

### ✨ **Refactored & Clean**
- **Removed** all unused React/TypeScript development code
- **Removed** redundant build scripts and configurations  
- **Removed** backup directories and test files
- **Kept** only the working extension code
- **Maintained** full functionality with minimal footprint

### 🎯 **Benefits**
- **Smaller repository size** - easier to clone and maintain
- **Clear structure** - easy to understand and modify
- **No confusion** - only working code is present
- **Faster builds** - no unused dependencies
- **Clean git history** - focused on the working solution

## 🚀 **Version History**

### v1.0.0-namespace-selector
- ✨ Complete namespace selector implementation
- 🔄 Cross-namespace resource filtering
- 📊 Real-time status updates
- 🎨 Enhanced UI with namespace management
- 🧹 **Cleaned up all redundant code**

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 **Links**

- **GitHub Repository**: https://github.com/saptak/envoy-gateway-docker-desktop-extension
- **Envoy Gateway Documentation**: https://gateway.envoyproxy.io
- **Docker Desktop Extensions**: https://docs.docker.com/desktop/extensions/

---

**🎉 A clean, focused implementation providing a frictionless developer experience for managing Envoy Gateway resources across multiple Kubernetes namespaces!**