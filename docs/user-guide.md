# User Guide - Envoy Gateway Docker Desktop Extension

## Getting Started

This guide will walk you through using the Envoy Gateway Docker Desktop Extension for the first time.

## Prerequisites

Before using the extension, ensure:
- Docker Desktop is running with Kubernetes enabled
- You have sufficient resources allocated (minimum 2GB RAM)
- The extension is installed and visible in the Docker Desktop Extensions tab

## Initial Setup

### Step 1: Launch the Extension
1. Open Docker Desktop
2. Click on the **Extensions** tab
3. Click on **Envoy Gateway** to launch the extension

### Step 2: Deploy Envoy Gateway
If Envoy Gateway isn't already installed on your cluster:
1. Click the **Deploy Envoy Gateway** button
2. Wait for the deployment to complete (usually 1-2 minutes)
3. The status indicator will turn green when ready

## Main Interface Overview

### Dashboard
The main dashboard displays:
- **Status Panel**: Overall health of Envoy Gateway
- **Resource Count**: Number of gateways, routes, and services
- **Activity Log**: Real-time events and actions
- **Quick Actions**: Deploy, refresh, and management buttons

### Navigation Tabs
- **Dashboard**: Overview and quick actions
- **Gateways**: Manage gateway resources
- **Routes**: Configure HTTP/TCP routes
- **Monitoring**: View metrics and logs
- **Settings**: Extension preferences

## Managing Gateways

### Creating a Gateway
1. Navigate to the **Gateways** tab
2. Click **Create Gateway**
3. Fill in the form:
   - **Name**: Unique identifier for your gateway
   - **Namespace**: Target namespace (default: default)
   - **Listeners**: Configure ports and protocols
   - **Class**: Gateway class (default: envoy-gateway)
4. Click **Create**

### Gateway Configuration Options
- **HTTP Listener**: For web traffic (port 80 or 8080)
- **HTTPS Listener**: For secure traffic (port 443)
- **TCP Listener**: For non-HTTP protocols
- **Custom Listeners**: Advanced port/protocol configurations

### Editing Gateways
1. Click on a gateway in the list
2. Use the **Edit** button to modify configuration
3. Apply changes with **Update Gateway**

## Route Management

### Creating HTTP Routes
1. Navigate to the **Routes** tab
2. Click **Create Route**
3. Configure the route:
   - **Name**: Route identifier
   - **Gateway**: Select target gateway
   - **Hostnames**: Domain names for routing
   - **Path Matching**: URL patterns to match
   - **Backend Services**: Target services and weights

### Route Types
- **Exact Match**: `/api/v1` matches exactly
- **Path Prefix**: `/api` matches `/api/*`
- **Regular Expression**: Advanced pattern matching

### Backend Configuration
- **Service Reference**: Kubernetes service name
- **Port**: Service port number
- **Weight**: Load balancing weight (for multiple backends)

### Testing Routes
1. Select a route from the list
2. Click **Test Route**
3. Choose a test method (GET, POST, etc.)
4. View response details and metrics

## Monitoring and Observability

### Real-time Metrics
The monitoring tab shows:
- **Request Rate**: Requests per second
- **Success Rate**: Percentage of successful requests
- **Response Times**: Latency percentiles
- **Error Rates**: Failed request statistics

### Activity Logs
- View real-time events and state changes
- Filter by resource type or namespace
- Export logs for troubleshooting

### Health Checks
- Gateway component status
- Backend service health
- Certificate validity (for HTTPS)

## Namespace Management

### Switching Namespaces
1. Use the namespace selector dropdown
2. Select desired namespace
3. Resources will automatically refresh

### Cross-namespace Routing
- Gateways can reference services in other namespaces
- Use fully qualified service names: `service.namespace.svc.cluster.local`

## Advanced Features

### Middleware and Filters
- **Rate Limiting**: Control request rates per client
- **CORS**: Configure cross-origin resource sharing
- **Authentication**: JWT validation and other auth methods
- **Request/Response Transformation**: Modify headers and bodies

### TLS Configuration
1. Upload or reference certificates
2. Configure TLS termination at the gateway
3. Set up automatic certificate management

### Load Balancing
- **Round Robin**: Default load balancing
- **Least Connections**: Route to least busy backend
- **Hash-based**: Consistent routing based on headers

## Best Practices

### Gateway Design
- Use separate gateways for different environments
- Group related services under a single gateway
- Implement proper TLS termination

### Route Organization
- Use descriptive names for routes
- Implement proper error handling
- Set appropriate timeouts

### Security
- Enable authentication where needed
- Use rate limiting to prevent abuse
- Implement proper CORS policies

### Performance
- Monitor response times and error rates
- Use health checks for backend services
- Implement circuit breaker patterns

## Troubleshooting

### Common Issues
- **Gateway not receiving traffic**: Check DNS and port configurations
- **Routes not working**: Verify backend services are running
- **High latency**: Check resource allocation and service health

### Debug Tools
- Use the built-in route tester
- Check activity logs for errors
- Monitor metrics for anomalies

For detailed troubleshooting, see the [Troubleshooting Guide](troubleshooting.md).

## Tips and Tricks

### Keyboard Shortcuts
- `Ctrl+R` (or `Cmd+R`): Refresh current view
- `Ctrl+F` (or `Cmd+F`): Search resources
- `Esc`: Close dialogs and modals

### Bulk Operations
- Use shift-click to select multiple items
- Perform batch actions on selected resources
- Export configurations for backup

### Integration with kubectl
- Copy resource YAML for kubectl usage
- Import existing resources from cluster
- Sync changes between extension and CLI

---

## Next Steps

- Explore the [API Reference](api-reference.md) for advanced integrations
- Check out [Examples](examples.md) for common use cases
- Join the [Community](https://gateway.envoyproxy.io/community/) for support and discussions