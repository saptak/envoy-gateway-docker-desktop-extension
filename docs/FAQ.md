# Frequently Asked Questions (FAQ)

## General Questions

### Q: What is the Envoy Gateway Docker Desktop Extension?
**A:** The Envoy Gateway Docker Desktop Extension is a GUI tool that integrates directly into Docker Desktop, allowing developers to manage Envoy Gateway instances, configure routes, test APIs, and monitor traffic without using command-line tools or external dashboards.

### Q: Do I need Kubernetes knowledge to use this extension?
**A:** Basic Kubernetes concepts are helpful but not required. The extension abstracts most Kubernetes complexity, providing an intuitive interface for gateway management. However, understanding concepts like services, namespaces, and pods will enhance your experience.

### Q: Can I use this extension with existing Envoy Gateway installations?
**A:** Yes! The extension can connect to and manage existing Envoy Gateway installations in your Docker Desktop Kubernetes cluster. It will auto-discover existing gateways and allow you to manage them through the GUI.

## Installation and Setup

### Q: What are the minimum requirements for the extension?
**A:** You need:
- Docker Desktop 4.8 or higher
- Kubernetes enabled in Docker Desktop
- At least 4GB RAM allocated to Docker
- Administrator privileges for initial installation

### Q: The extension fails to install. What should I do?
**A:** Common solutions:
1. Restart Docker Desktop and try again
2. Ensure you have sufficient disk space (>1GB free)
3. Check that no antivirus software is blocking the installation
4. Try installing from the command line: `docker extension install envoyproxy/gateway-extension`

### Q: How do I uninstall the extension?
**A:** 
1. Open Docker Desktop
2. Navigate to Extensions → Manage
3. Find "Envoy Gateway" and click **Uninstall**
4. Alternatively, use: `docker extension uninstall envoy-gateway-extension`

## Configuration and Usage

### Q: Can I import existing Gateway API configurations?
**A:** Yes! The extension supports importing YAML configurations:
1. Navigate to **Import/Export** → **Import Configuration**
2. Upload your YAML files or paste the configuration
3. The extension will validate and deploy the configuration

### Q: How do I backup my gateway configurations?
**A:** Use the export feature:
1. Go to **Gateway Settings** → **Export Configuration**
2. Choose export format (YAML, JSON)
3. Download the configuration files
4. Store them in version control for backup

### Q: Can I configure custom filters and plugins?
**A:** Yes, the extension supports:
- Built-in filters (rate limiting, authentication, transformation)
- Custom EnvoyFilter resources
- WebAssembly plugins (advanced users)
- External authorization services

### Q: How do I set up load balancing across multiple backends?
**A:** 
1. Create multiple backend references in your route
2. Configure weights for each backend
3. Choose load balancing algorithm (round-robin, least-request, etc.)
4. Set health check policies for automatic failover

## Troubleshooting

### Q: My gateway shows "Pending" status indefinitely
**A:** Check these items:
1. Verify Kubernetes is running: `kubectl cluster-info`
2. Check resource availability: `kubectl describe gateway <name>`
3. View events tab in the extension for error details
4. Ensure the gateway class exists: `kubectl get gatewayclass`

### Q: Routes return 404 errors despite being configured
**A:** Verify:
1. Path patterns are correct (exact vs. prefix matching)
2. Hostname matching if configured
3. Backend services are running and accessible
4. Route priorities aren't conflicting
5. Use the route tester tool in the extension

### Q: High latency through the gateway
**A:** Investigate:
1. Backend service response times
2. Gateway timeout configurations
3. Resource limits on the gateway pods
4. Network latency between components
5. Use the performance analyzer in the monitoring tab

### Q: Authentication not working with JWT
**A:** Common issues:
1. Verify JWT issuer and audience configuration
2. Check JWKS endpoint accessibility
3. Ensure clock synchronization for token expiry
4. Test JWT tokens with online debuggers first

## Monitoring and Observability

### Q: How do I access detailed logs?
**A:** The extension provides multiple log views:
1. **Logs** tab for real-time log streaming
2. **Events** tab for Kubernetes events
3. **Audit** tab for configuration changes
4. Export logs for external analysis

### Q: Can I integrate with external monitoring tools?
**A:** Yes, the extension supports:
- Prometheus metrics export
- Jaeger/OpenTelemetry tracing
- Custom webhook notifications
- Log forwarding to external systems

### Q: What metrics should I monitor in production?
**A:** Key metrics include:
- Request rate (RPS)
- Error rates (4xx, 5xx)
- Response times (P50, P95, P99)
- Gateway resource utilization
- Backend health status

## Security

### Q: How do I secure my gateway with TLS?
**A:** 
1. Generate or obtain SSL certificates
2. Upload certificates in **Security** → **TLS**
3. Configure HTTPS listener on port 443
4. Set up HTTP-to-HTTPS redirect
5. Test with SSL tools

### Q: Can I integrate with external auth providers?
**A:** Yes, supported integrations include:
- OAuth 2.0 / OpenID Connect
- LDAP/Active Directory
- Keycloak, Auth0, Okta
- Custom authentication services
- JWT token validation

### Q: How do I implement rate limiting?
**A:** 
1. Navigate to route configuration
2. Add **Rate Limiting** filter
3. Configure limits (per minute/hour)
4. Set burst allowances
5. Choose rate limiting key (IP, user, header)

## Performance and Scaling

### Q: How many concurrent connections can the gateway handle?
**A:** Performance depends on:
- Available resources (CPU, memory)
- Backend service capacity
- Configuration complexity
- Network infrastructure
The extension includes load testing tools to determine your specific limits.

### Q: Can I horizontally scale the gateway?
**A:** Yes:
1. Configure multiple gateway replicas
2. Use load balancer for external traffic
3. Set appropriate resource requests/limits
4. Monitor and auto-scale based on metrics

### Q: How do I optimize gateway performance?
**A:** Best practices:
1. Tune resource allocations
2. Optimize route ordering
3. Use connection pooling
4. Configure appropriate timeouts
5. Regular performance testing

## Development and Testing

### Q: Can I test routes before deploying?
**A:** Absolutely:
1. Use **Configuration Validator** for syntax checking
2. **Dry-run** deployment mode
3. Built-in HTTP client for route testing
4. Load testing capabilities
5. Staging environment support

### Q: How do I debug routing issues?
**A:** Tools available:
1. Route matcher testing tool
2. Real-time traffic tracing
3. Detailed access logs
4. Request/response inspection
5. Route evaluation simulator

### Q: Can I set up CI/CD with this extension?
**A:** Yes, through:
1. Configuration export/import
2. REST API for programmatic control
3. GitOps workflow integration
4. Automated testing capabilities
5. Multi-environment promotion

## Advanced Features

### Q: Can I use custom EnvoyFilter resources?
**A:** Yes, for advanced users:
1. Create custom filters in **Advanced** → **Custom Resources**
2. Use WebAssembly for custom logic
3. Direct Envoy configuration access
4. Lua scripting support

### Q: How do I set up multi-cluster gateways?
**A:** Future feature, but you can:
1. Manage multiple single-cluster gateways
2. Use DNS-based routing between clusters
3. Export/import configurations across environments

### Q: Can I extend the extension with plugins?
**A:** Currently:
1. Custom filters and transformations
2. External service integrations
3. Webhook notifications
4. Plugin marketplace (planned for future releases)

## Community and Support

### Q: Where can I get help if I'm stuck?
**A:** Resources available:
1. GitHub Discussions for community help
2. Documentation and tutorials
3. Issue tracker for bug reports
4. Community Slack channel
5. Professional support options

### Q: How do I contribute to the project?
**A:** We welcome contributions:
1. Check the **CONTRIBUTING.md** guide
2. Start with good first issues
3. Submit bug reports and feature requests
4. Contribute to documentation
5. Join community discussions

### Q: Is there a roadmap for future features?
**A:** Yes! See **ROADMAP.md** for:
1. Planned feature timeline
2. Community voting on features
3. Release schedules
4. Long-term vision

---

## Still Have Questions?

If your question isn't answered here:
1. Check the [User Guide](USER_GUIDE.md) for detailed usage instructions
2. Search existing [GitHub Discussions](https://github.com/envoyproxy/gateway-docker-extension/discussions)
3. Create a new discussion for community help
4. Report bugs on the [issue tracker](https://github.com/envoyproxy/gateway-docker-extension/issues)

We're always improving this FAQ based on community feedback!
