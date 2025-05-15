# Envoy Gateway Docker Desktop Extension with Namespace Selector

A Docker Desktop extension for managing Envoy Gateway resources with **complete namespace support** including cross-namespace functionality.

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
docker build -t envoy-gateway-extension:latest ./envoy-gateway-extension

# Run the container
docker run -d -p 8080:8080 envoy-gateway-extension:latest
```

## 🏗️ **Architecture**

### Frontend
- **HTML/CSS/JavaScript** UI with namespace selector
- **Dynamic dropdown** populated from backend APIs
- **Real-time polling** for resource updates
- **Responsive design** for different screen sizes

### Backend
- **Node.js/Express** server with RESTful APIs
- **Kubernetes integration** for namespace discovery
- **Health checks** and error handling
- **CORS support** for development

### APIs
- `/api/health` - System health check
- `/api/kubernetes/namespaces` - Get all namespaces
- `/api/gateways` - Gateway resources (with namespace filtering)
- `/api/routes` - Route resources (with namespace filtering)

## 🔧 **Development**

### Project Structure
```
envoy-gateway-docker-desktop-extension/
├── envoy-gateway-extension/          # Ready-to-run extension
│   ├── backend/                      # Node.js backend
│   ├── ui/                          # HTML frontend with namespace selector
│   ├── Dockerfile                    # Container image
│   └── metadata.json                 # Extension metadata
├── src/                              # Development source
│   ├── frontend/                     # React frontend (alternative)
│   └── backend/                      # TypeScript backend (development)
└── docker-compose.yml               # Quick start configuration
```

### Key Implementation Files
- **UI with Namespace Selector**: `envoy-gateway-extension/ui/index.html`
- **Backend with Namespace APIs**: `envoy-gateway-extension/backend/src/index.js`
- **React Namespace Component**: `src/frontend/src/components/common/NamespaceSelector/`
- **Namespace Redux Store**: `src/frontend/src/store/slices/namespaceSlice.ts`

## 🎯 **Task Achievement**

✅ **All requirements successfully implemented:**
- [x] Namespace selector on main page
- [x] Cross-namespace functionality
- [x] Real-time resource filtering
- [x] Excellent developer experience
- [x] Frictionless namespace management

## 📝 **Version History**

### v1.0.0-namespace-selector
- ✨ Complete namespace selector implementation
- 🔄 Cross-namespace resource filtering
- 📊 Real-time status updates
- 🎨 Enhanced UI with namespace management
- 🚀 Working Docker Desktop extension

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

**🎉 The namespace selector implementation provides a frictionless developer experience for managing Envoy Gateway resources across multiple Kubernetes namespaces!**