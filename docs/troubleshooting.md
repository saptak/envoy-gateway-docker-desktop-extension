# Troubleshooting Guide

## Common Issues and Solutions

### Extension Won't Install

**Symptoms**: Error during extension installation
**Causes**: 
- Insufficient privileges
- Docker Desktop version too old
- Corrupted extension image

**Solutions**:
1. Ensure you have administrative privileges
2. Update Docker Desktop to version 4.8.0 or later
3. Clear Docker cache and retry: `docker system prune -a`

### Extension Loads But Shows No Data

**Symptoms**: Extension interface is blank or shows "No resources found"
**Causes**:
- Kubernetes not enabled
- Insufficient cluster resources
- Namespace issues

**Solutions**:
1. Enable Kubernetes in Docker Desktop (Settings → Kubernetes)
2. Restart Docker Desktop
3. Check selected namespace in the extension
4. Verify cluster has sufficient resources (2GB+ RAM)

### Envoy Gateway Deployment Failed

**Symptoms**: Error when clicking "Deploy Envoy Gateway"
**Causes**:
- Insufficient cluster resources
- Conflicting installations
- Network policy restrictions

**Solutions**:
1. Check cluster resources: `kubectl get nodes` and `kubectl describe node`
2. Remove existing Envoy Gateway: `kubectl delete namespace envoy-gateway-system`
3. Clear Docker Desktop Kubernetes and reset

### Routes Not Working

**Symptoms**: Created routes show errors or don't receive traffic
**Causes**:
- DNS resolution issues
- Port conflicts
- Backend service not running

**Solutions**:
1. Verify backend services are running: `kubectl get pods`
2. Check service endpoints: `kubectl get endpoints`
3. Test with port-forward: `kubectl port-forward service/your-service 8080:8080`

### Performance Issues

**Symptoms**: Slow response times or high resource usage
**Causes**:
- Insufficient Docker Desktop resources
- Multiple extensions running
- Complex route configurations

**Solutions**:
1. Increase Docker Desktop memory allocation (Settings → Resources)
2. Close unused extensions
3. Simplify route configurations
4. Monitor resource usage in Activity Monitor (Mac) or Task Manager (Windows)

## Debugging Steps

### Check Extension Logs
```bash
# View extension logs
docker extension ls
docker logs <extension-container-id>
```

### Verify Kubernetes Status
```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

### Inspect Envoy Gateway
```bash
# Check Envoy Gateway installation
kubectl get pods -n envoy-gateway-system
kubectl logs -n envoy-gateway-system deployment/envoy-gateway
```

### Test API Connectivity
```bash
# Test extension backend API
curl http://localhost:8080/api/health
curl http://localhost:8080/api/status
```

## Configuration Issues

### Namespace Access
If you can't see resources in certain namespaces:
1. Check RBAC permissions
2. Verify namespace exists: `kubectl get namespaces`
3. Switch to different namespace in the extension

### Network Connectivity
For network-related issues:
1. Check Docker Desktop network settings
2. Verify no VPN interference
3. Test with simplified configurations

## Getting Help

### Enable Debug Mode
Set environment variable for detailed logging:
```bash
DD_EXTENSION_DEBUG=true
```

### Collect Diagnostics
```bash
# Collect system information
docker system info > docker-info.txt
kubectl version > kubectl-version.txt
kubectl get all --all-namespaces > cluster-state.txt
```

### Contact Support
When reporting issues, include:
- Docker Desktop version
- Extension version
- Error messages and logs
- System information (OS, RAM, CPU)
- Steps to reproduce

### Reset Extension
If all else fails, completely reset:
```bash
# Uninstall extension
docker extension uninstall envoy-gateway-extension:latest

# Clean up Docker
docker system prune -a

# Reset Kubernetes
# Docker Desktop → Settings → Kubernetes → Reset Kubernetes Cluster

# Reinstall extension
docker extension install envoy-gateway-extension:latest
```

## FAQ

**Q: Can I use this extension with an existing Envoy Gateway installation?**
A: Yes, the extension will detect and work with existing installations.

**Q: Does this work with production Kubernetes clusters?**
A: This extension is designed for local development with Docker Desktop. For production use, consider the official Envoy Gateway CLI tools.

**Q: Can I backup my configurations?**
A: Export your configurations using kubectl: `kubectl get gateways,httproutes -o yaml > backup.yaml`

**Q: Why is the extension using high CPU/memory?**
A: The extension includes real-time monitoring. You can adjust refresh intervals in the settings.

---

Still having issues? Please visit our [GitHub Issues](https://github.com/envoyproxy/gateway/issues) page or [Community Forum](https://gateway.envoyproxy.io/community/) for additional support.