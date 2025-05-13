# Troubleshooting Guide

This guide provides solutions to common issues you might encounter while using the Envoy Gateway Docker Desktop Extension.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Gateway Deployment Problems](#gateway-deployment-problems)
3. [Route Configuration Issues](#route-configuration-issues)
4. [Network and Connectivity Problems](#network-and-connectivity-problems)
5. [Performance Issues](#performance-issues)
6. [Security and Authentication Problems](#security-and-authentication-problems)
7. [Monitoring and Logging Issues](#monitoring-and-logging-issues)
8. [General Docker Desktop Issues](#general-docker-desktop-issues)
9. [Diagnostic Commands](#diagnostic-commands)

---

## Installation Issues

### Extension Installation Fails

**Symptoms:**
- Error message during installation
- Extension not appearing in the Extensions list
- Installation hangs or times out

**Solutions:**

1. **Check Docker Desktop Version**
   ```bash
   # Ensure Docker Desktop is 4.8+
   docker version
   ```

2. **Restart Docker Desktop**
   - Fully quit Docker Desktop
   - Restart and wait for it to fully load
   - Try installation again

3. **Clear Docker Extension Cache**
   ```bash
   # Remove extension cache
   docker extension ls
   docker system prune -a
   ```

4. **Install from Command Line**
   ```bash
   # Try manual installation
   docker extension install envoyproxy/gateway-extension:latest
   ```

5. **Check Disk Space**
   - Ensure at least 1GB free space
   - Clean up unused Docker resources

### Kubernetes Not Available

**Symptoms:**
- "Kubernetes is not enabled" error
- Extension can't connect to cluster

**Solutions:**

1. **Enable Kubernetes in Docker Desktop**
   - Open Docker Desktop Settings
   - Navigate to Kubernetes
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"
   - Wait for cluster to be ready (green indicator)

2. **Reset Kubernetes Cluster**
   - In Docker Desktop Settings → Kubernetes
   - Click "Reset Kubernetes Cluster"
   - Confirm reset and wait for completion

3. **Verify Kubernetes Status**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

---

## Gateway Deployment Problems

### Gateway Stuck in Pending State

**Symptoms:**
- Gateway status shows "Pending" indefinitely
- No external IP assigned

**Diagnosis Steps:**

1. **Check Gateway Status**
   ```bash
   kubectl get gateway -n envoy-gateway-system
   kubectl describe gateway <gateway-name> -n envoy-gateway-system
   ```

2. **Check Events**
   ```bash
   kubectl get events -n envoy-gateway-system --sort-by=.firstTimestamp
   ```

3. **Verify Gateway Class**
   ```bash
   kubectl get gatewayclass
   kubectl describe gatewayclass envoy-gateway
   ```

**Solutions:**

1. **Resource Constraints**
   - Check CPU/Memory limits
   - Increase Docker Desktop resource allocation
   - Verify no resource quotas are exceeded

2. **Missing Prerequisites**
   ```bash
   # Ensure Envoy Gateway is installed
   kubectl get pods -n envoy-gateway-system
   
   # If missing, reinstall via extension
   ```

3. **Configuration Errors**
   - Check gateway specification in the extension
   - Validate YAML syntax
   - Ensure all required fields are present

### Gateway Fails to Start

**Symptoms:**
- Gateway status shows "Failed"
- Pods crash or restart repeatedly

**Diagnosis:**

1. **Check Pod Status**
   ```bash
   kubectl get pods -n envoy-gateway-system
   kubectl logs -n envoy-gateway-system <envoy-gateway-pod>
   ```

2. **Check Resource Usage**
   ```bash
   kubectl top pods -n envoy-gateway-system
   kubectl describe pod -n envoy-gateway-system <pod-name>
   ```

**Solutions:**

1. **Increase Resource Limits**
   - Navigate to Gateway Settings → Resources
   - Increase CPU/Memory limits
   - Redeploy gateway

2. **Fix Configuration Issues**
   - Check extension logs for validation errors
   - Verify all referenced secrets/configmaps exist
   - Remove any invalid configuration

3. **Port Conflicts**
   - Ensure port 8080 isn't used by other applications
   - Change gateway port in configuration
   - Check for firewall restrictions

---

## Route Configuration Issues

### Routes Return 404 Errors

**Symptoms:**
- Configured routes return "404 Not Found"
- Traffic not reaching backend services

**Diagnosis:**

1. **Test Route Matching**
   - Use extension's Route Tester tool
   - Check path pattern matching
   - Verify hostname requirements

2. **Check Route Status**
   ```bash
   kubectl get httproute -A
   kubectl describe httproute <route-name>
   ```

3. **Verify Backend Services**
   ```bash
   kubectl get services -A
   kubectl describe service <backend-service>
   ```

**Solutions:**

1. **Fix Path Patterns**
   - Use `/api/v1/*` for prefix matching
   - Use `/api/v1/exact` for exact matching
   - Check path case sensitivity

2. **Verify Service Configuration**
   - Ensure backend service exists and is running
   - Check service port configuration
   - Verify namespace settings

3. **Route Priority Issues**
   - Check route priorities in extension
   - More specific routes should have higher priority
   - Reorder routes if necessary

### Backend Services Unreachable

**Symptoms:**
- 502 Bad Gateway errors
- Service connection timeouts

**Diagnosis:**

1. **Test Service Directly**
   ```bash
   kubectl port-forward service/<service-name> 8080:80
   curl http://localhost:8080
   ```

2. **Check Service Health**
   ```bash
   kubectl get pods -l app=<backend-app>
   kubectl logs <backend-pod>
   ```

**Solutions:**

1. **Fix Service Discovery**
   - Verify service name and namespace in route config
   - Check service selector labels
   - Ensure pods are properly labeled

2. **Health Check Configuration**
   - Configure proper health checks
   - Set appropriate timeout values
   - Enable health check in route settings

3. **Network Policies**
   - Check for restrictive network policies
   - Verify namespace communication is allowed

---

## Network and Connectivity Problems

### External Traffic Not Reaching Gateway

**Symptoms:**
- Cannot access gateway from outside cluster
- Connection refused or timeout errors

**Diagnosis:**

1. **Check Service Type**
   ```bash
   kubectl get service -n envoy-gateway-system
   ```

2. **Test Internal Access**
   ```bash
   kubectl exec -it <test-pod> -- curl http://gateway-service:8080
   ```

**Solutions:**

1. **LoadBalancer Service Issues**
   - Docker Desktop uses NodePort or port-forward
   - Verify port forwarding is active
   - Check if LoadBalancer IP is assigned

2. **Port Forwarding Setup**
   ```bash
   # Manually port-forward for testing
   kubectl port-forward -n envoy-gateway-system service/envoy-gateway 8080:8080
   ```

3. **Firewall Restrictions**
   - Check local firewall settings
   - Ensure port 8080 is not blocked
   - Verify Docker Desktop networking settings

### DNS Resolution Issues

**Symptoms:**
- Cannot resolve service names
- Intermittent connectivity issues

**Solutions:**

1. **Check CoreDNS**
   ```bash
   kubectl get pods -n kube-system -l k8s-app=kube-dns
   kubectl logs -n kube-system -l k8s-app=kube-dns
   ```

2. **Test DNS Resolution**
   ```bash
   kubectl run test-pod --rm -it --image=busybox -- nslookup <service-name>
   ```

3. **Fix DNS Configuration**
   - Restart CoreDNS pods if necessary
   - Check service discovery settings
   - Verify namespace resolution

---

## Performance Issues

### High Latency Through Gateway

**Symptoms:**
- Slow response times
- Increased latency compared to direct access

**Diagnosis:**

1. **Use Performance Analyzer**
   - Check extension's monitoring tab
   - Compare gateway vs. direct backend latency
   - Identify bottlenecks in request path

2. **Check Resource Usage**
   ```bash
   kubectl top pods -n envoy-gateway-system
   kubectl top nodes
   ```

**Solutions:**

1. **Optimize Gateway Configuration**
   - Increase connection pool limits
   - Adjust timeout settings
   - Configure appropriate buffer sizes

2. **Resource Scaling**
   - Increase gateway pod resources
   - Scale gateway horizontally
   - Optimize backend service performance

3. **Connection Management**
   - Enable HTTP/2 where possible
   - Configure keep-alive properly
   - Optimize load balancing algorithms

### Memory/CPU Resource Issues

**Symptoms:**
- Gateway pods being killed (OOMKilled)
- High CPU usage

**Solutions:**

1. **Increase Resource Limits**
   ```yaml
   # In gateway configuration
   resources:
     limits:
       memory: "2Gi"
       cpu: "1000m"
     requests:
       memory: "1Gi"
       cpu: "500m"
   ```

2. **Optimize Configuration**
   - Reduce logging verbosity if not needed
   - Optimize filter chain configuration
   - Remove unnecessary features

3. **Monitor Resource Usage**
   - Use extension's resource monitoring
   - Set up alerts for high usage
   - Plan capacity based on actual usage

---

## Security and Authentication Problems

### TLS Certificate Issues

**Symptoms:**
- HTTPS connections fail
- Certificate validation errors

**Diagnosis:**

1. **Check Certificate Status**
   ```bash
   kubectl get secret -n envoy-gateway-system
   kubectl describe secret <tls-secret>
   ```

2. **Verify Certificate**
   ```bash
   openssl x509 -in cert.pem -text -noout
   ```

**Solutions:**

1. **Fix Certificate Configuration**
   - Ensure certificate and key match
   - Check certificate expiration
   - Verify hostname in certificate

2. **Upload New Certificate**
   - Use extension's TLS management interface
   - Generate new certificate if needed
   - Update gateway configuration

### JWT Authentication Failures

**Symptoms:**
- 401 Unauthorized errors
- JWT validation failures

**Solutions:**

1. **Verify JWT Configuration**
   - Check issuer and audience settings
   - Verify JWKS endpoint accessibility
   - Test JWT tokens manually

2. **Debug JWT Issues**
   - Use extension's authentication debugger
   - Check token expiration times
   - Verify signing algorithm compatibility

3. **Clock Synchronization**
   - Ensure system clocks are synchronized
   - Check token expiration timing
   - Allow for reasonable clock skew

---

## Monitoring and Logging Issues

### Missing Metrics

**Symptoms:**
- Monitoring dashboard shows no data
- Metrics not appearing

**Solutions:**

1. **Enable Metrics Collection**
   - Check extension's monitoring settings
   - Verify Prometheus integration
   - Ensure metrics are exposed

2. **Fix Service Discovery**
   ```bash
   kubectl get servicemonitor -A
   kubectl logs -n envoy-gateway-system <prometheus-pod>
   ```

### Logs Not Appearing

**Symptoms:**
- No logs in extension interface
- Missing log entries

**Solutions:**

1. **Check Log Configuration**
   - Verify log level settings
   - Ensure log forwarding is enabled
   - Check log format configuration

2. **Access Logs Directly**
   ```bash
   kubectl logs -n envoy-gateway-system -l app=envoy-gateway
   ```

---

## General Docker Desktop Issues

### Docker Desktop Won't Start

**Solutions:**

1. **Restart Docker Service**
   - Fully quit Docker Desktop
   - Wait 30 seconds
   - Restart Docker Desktop

2. **Reset Docker Desktop**
   - Use "Reset to Factory Defaults" (saves images/containers)
   - Or "Reset and Clean" (removes everything)

3. **Check System Resources**
   - Ensure sufficient RAM (8GB+ recommended)
   - Check available disk space
   - Close other resource-intensive applications

### Extension UI Not Loading

**Symptoms:**
- Extension tab shows blank page
- Loading spinner indefinitely

**Solutions:**

1. **Refresh Extension**
   - Close and reopen extension tab
   - Restart Docker Desktop
   - Clear browser cache in Docker Desktop

2. **Check Extension Status**
   ```bash
   docker extension ls
   docker extension logs envoy-gateway-extension
   ```

---

## Diagnostic Commands

### Essential Diagnostic Commands

```bash
# Check overall cluster status
kubectl cluster-info

# Check all Envoy Gateway resources
kubectl get all -n envoy-gateway-system

# Check gateway and route status
kubectl get gateway,httproute -A

# View extension logs
docker extension logs envoy-gateway-extension

# Check resource usage
kubectl top pods -n envoy-gateway-system
kubectl top nodes

# Get detailed information
kubectl describe gateway <gateway-name>
kubectl describe httproute <route-name>

# Check events for issues
kubectl get events -n envoy-gateway-system --sort-by=.firstTimestamp

# Test connectivity
kubectl run test-pod --rm -it --image=curlimages/curl -- curl http://gateway-service:8080
```

### Log Analysis

```bash
# Gateway logs
kubectl logs -n envoy-gateway-system -l app=envoy-gateway -f

# Envoy proxy logs
kubectl logs -n envoy-gateway-system -l app=envoy -f

# Extension logs
docker extension logs envoy-gateway-extension --tail 100
```

---

## Getting Additional Help

If these solutions don't resolve your issue:

1. **Search Existing Issues**
   - Check [GitHub Issues](https://github.com/envoyproxy/gateway-docker-extension/issues)
   - Search community discussions

2. **Gather Diagnostic Information**
   - Extension version and Docker Desktop version
   - Kubernetes cluster information
   - Relevant logs and error messages
   - Steps to reproduce the issue

3. **Report the Issue**
   - Create a detailed issue report
   - Include diagnostic information
   - Provide minimal reproduction steps

4. **Join Community Support**
   - Discord/Slack community channels
   - GitHub Discussions
   - Stack Overflow with `envoy-gateway` tag

Remember to include relevant logs and configuration details when seeking help!
