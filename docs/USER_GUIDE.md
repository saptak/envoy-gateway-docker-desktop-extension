# Envoy Gateway Docker Desktop Extension - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Gateway Setup](#basic-gateway-setup)
3. [Route Configuration](#route-configuration)
4. [API Testing](#api-testing)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Advanced Configuration](#advanced-configuration)
7. [Security Configuration](#security-configuration)
8. [Multi-Environment Management](#multi-environment-management)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

Before using the Envoy Gateway Docker Desktop Extension, ensure you have:

- Docker Desktop 4.8+ installed and running
- Kubernetes enabled in Docker Desktop
- At least 4GB of RAM allocated to Docker
- Basic knowledge of API gateways and Kubernetes concepts

### Installation

#### Step 1: Install the Extension

1. Open Docker Desktop
2. Navigate to **Extensions** in the left sidebar
3. Click **Browse** or **Add Extension**
4. Search for "Envoy Gateway"
5. Click **Install** next to the Envoy Gateway extension
6. Wait for installation to complete (usually 30-60 seconds)

![Extension Installation](assets/screenshots/installation.png)

#### Step 2: First Launch

1. After installation, click on **Envoy Gateway** in the Extensions panel
2. The extension will open in a new tab within Docker Desktop
3. You'll see the welcome screen with setup options

![Welcome Screen](assets/screenshots/welcome.png)

#### Step 3: Initial Setup

1. Click **Get Started** on the welcome screen
2. The extension will automatically check your Docker Desktop configuration
3. If Kubernetes is not enabled, you'll be prompted to enable it
4. Wait for the initial setup to complete (2-3 minutes)

---

## Basic Gateway Setup

### Scenario 1: Creating Your First Gateway

#### Step 1: Navigate to Gateway Management

1. From the main dashboard, click **Create Gateway**
2. You'll be taken to the Gateway Configuration wizard

#### Step 2: Choose a Template

1. Select **Basic HTTP Gateway** from the template gallery
2. This template provides a simple HTTP gateway suitable for getting started
3. Click **Next** to proceed

![Template Selection](assets/screenshots/template-selection.png)

#### Step 3: Configure Basic Settings

1. **Gateway Name**: Enter `my-first-gateway`
2. **Namespace**: Keep default `envoy-gateway-system`
3. **Port**: Keep default `8080`
4. **Description**: Enter "My first Envoy Gateway"
5. Click **Next** to continue

#### Step 4: Review and Deploy

1. Review the generated configuration in the preview panel
2. The YAML shows the Gateway and GatewayClass resources
3. Click **Deploy Gateway** to create the resources
4. Wait for deployment status to show "Running" (30-60 seconds)

![Gateway Deployment](assets/screenshots/gateway-deployment.png)

#### Step 5: Verify Deployment

1. Navigate to the **Dashboard** tab
2. Your gateway should appear in the "Active Gateways" section
3. Status should show as **Running** with a green indicator
4. Note the external URL (usually `http://localhost:8080`)

---

## Route Configuration

### Scenario 2: Adding Routes to Your Gateway

#### Step 1: Access Route Management

1. From the dashboard, click on your gateway name
2. Navigate to the **Routes** tab
3. Click **Add Route** to create a new route

#### Step 2: Configure Basic Route

1. **Route Name**: Enter `api-route`
2. **Path Pattern**: Enter `/api/v1/*`
3. **Method**: Select **All** (or specify GET, POST, etc.)
4. **Backend Service**: 
   - Service Name: `backend-service`
   - Port: `8080`
   - Namespace: `default`

![Route Configuration](assets/screenshots/route-config.png)

#### Step 3: Add Advanced Matching (Optional)

1. Click **Advanced Matching**
2. Add header matching:
   - Header Name: `X-API-Version`
   - Value: `v1`
3. Add query parameter matching:
   - Parameter: `format`
   - Value: `json`

#### Step 4: Configure Route Behavior

1. **Timeout**: Set to `30s`
2. **Retry Policy**: Enable with `3` retries
3. **Load Balancing**: Select `round_robin`
4. **Weight**: Keep default `100`

#### Step 5: Apply Route Configuration

1. Click **Validate Configuration** to check for errors
2. Review the generated HTTPRoute YAML
3. Click **Apply Route** to deploy
4. Verify in the route list that status shows **Active**

### Scenario 3: Multiple Routes with Different Backends

#### Step 1: Create Frontend Route

1. Click **Add Route** again
2. Configure:
   - **Route Name**: `frontend-route`
   - **Path Pattern**: `/`
   - **Backend Service**: `frontend-service`
   - **Port**: `3000`

#### Step 2: Create API Route with Versioning

1. Add another route:
   - **Route Name**: `api-v2-route`
   - **Path Pattern**: `/api/v2/*`
   - **Backend Service**: `api-v2-service`
   - **Port**: `8082`

#### Step 3: Set Route Priorities

1. Click **Route Priority** for each route
2. Set priorities (lower number = higher priority):
   - `api-v2-route`: Priority `1`
   - `api-route`: Priority `2`
   - `frontend-route`: Priority `3`

---

## API Testing

### Scenario 4: Testing Your Gateway Routes

#### Step 1: Access the Testing Interface

1. Navigate to the **Testing** tab in the gateway view
2. You'll see the built-in HTTP client interface

#### Step 2: Basic API Test

1. **Request Configuration**:
   - Method: `GET`
   - URL: `http://localhost:8080/api/v1/users`
   - Headers: Add `Content-Type: application/json`

2. Click **Send Request**

3. **Review Response**:
   - Status code and response time appear instantly
   - Response body is displayed with syntax highlighting
   - Headers are shown in a separate tab

![API Testing](assets/screenshots/api-testing.png)

#### Step 3: POST Request with Body

1. Change method to `POST`
2. URL: `http://localhost:8080/api/v1/users`
3. Add request body:
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com"
   }
   ```
4. Send and verify response

#### Step 4: Collection Testing

1. Click **Save to Collection** to save the test
2. Create a test collection named "User API Tests"
3. Add multiple test cases for different endpoints
4. Use **Run Collection** to execute all tests sequentially

### Scenario 5: Load Testing

#### Step 1: Configure Load Test

1. Switch to **Load Testing** tab
2. Configure test parameters:
   - **Target URL**: `http://localhost:8080/api/v1/status`
   - **Concurrent Users**: `10`
   - **Duration**: `30 seconds`
   - **Ramp-up Time**: `5 seconds`

#### Step 2: Execute Load Test

1. Click **Start Load Test**
2. Monitor real-time metrics:
   - Requests per second
   - Average response time
   - Error rate
   - Response time percentiles

#### Step 3: Analyze Results

1. View the load test report
2. Export results as CSV or JSON
3. Use results to optimize gateway configuration

---

## Monitoring and Observability

### Scenario 6: Real-time Monitoring

#### Step 1: Access Monitoring Dashboard

1. Navigate to the **Monitoring** tab
2. View the main metrics dashboard

#### Step 2: Key Metrics to Monitor

1. **Request Rate**: Requests per second across all routes
2. **Response Times**: P50, P95, P99 percentiles
3. **Error Rates**: 4xx and 5xx error percentages
4. **Throughput**: Data transferred (MB/s)

![Monitoring Dashboard](assets/screenshots/monitoring.png)

#### Step 3: Set Up Alerts

1. Click **Configure Alerts**
2. Create alert rules:
   - High error rate (>5% 5xx errors)
   - High latency (P95 > 1000ms)
   - Low throughput (<10 RPS for 5 minutes)

#### Step 4: View Detailed Metrics

1. Click on any metric to drill down
2. View time-series charts with customizable time ranges
3. Compare metrics across different routes

### Scenario 7: Distributed Tracing

#### Step 1: Enable Tracing

1. Go to **Gateway Settings** → **Observability**
2. Enable **Distributed Tracing**
3. Configure Jaeger endpoint: `http://jaeger:14268`
4. Set sampling rate to `100%` for testing

#### Step 2: Generate Trace Data

1. Make several API requests through the gateway
2. Ensure requests include trace headers

#### Step 3: View Traces

1. Navigate to **Tracing** tab
2. Search for traces by:
   - Time range
   - Service name
   - Operation name
   - Trace ID

4. Click on individual traces to see the detailed span timeline

---

## Advanced Configuration

### Scenario 8: Custom Filters and Transformations

#### Step 1: Add Request Transformation

1. Go to **Routes** → Select a route → **Filters**
2. Click **Add Filter** → **Request Transform**
3. Configure transformation:
   ```yaml
   requestHeaderModifier:
     add:
       - name: "X-Custom-Header"
         value: "gateway-added"
     remove:
       - "X-Internal-Header"
   ```

#### Step 2: Add Response Transformation

1. Add **Response Transform** filter
2. Configure response modifications:
   ```yaml
   responseHeaderModifier:
     add:
       - name: "X-Gateway-Version"
         value: "1.0.0"
     set:
       - name: "Cache-Control"
         value: "max-age=3600"
   ```

#### Step 3: Rate Limiting

1. Add **Rate Limiting** filter
2. Configure rate limits:
   - **Requests per minute**: `100`
   - **Burst size**: `10`
   - **Key**: Client IP

### Scenario 9: Circuit Breaker Configuration

#### Step 1: Add Circuit Breaker

1. Navigate to **Route Settings** → **Resilience**
2. Enable **Circuit Breaker**
3. Configure parameters:
   - **Failure Threshold**: `50%`
   - **Minimum Requests**: `10`
   - **Timeout**: `10 seconds`

#### Step 2: Test Circuit Breaker

1. Use the load testing feature to trigger failures
2. Monitor circuit breaker state transitions
3. Verify automatic recovery behavior

---

## Security Configuration

### Scenario 10: TLS/SSL Configuration

#### Step 1: Certificate Management

1. Navigate to **Gateway Settings** → **Security** → **TLS**
2. Click **Add Certificate**
3. Upload or create certificates:
   - **Certificate File**: Upload your .crt file
   - **Private Key**: Upload your .key file
   - **Hostname**: `*.example.com`

#### Step 2: Enable HTTPS

1. Add HTTPS listener to your gateway:
   - **Protocol**: `HTTPS`
   - **Port**: `443`
   - **TLS Certificate**: Select uploaded certificate

#### Step 3: HTTP to HTTPS Redirect

1. Add redirect filter to HTTP listener
2. Configure automatic redirect to HTTPS

### Scenario 11: Authentication and Authorization

#### Step 1: Configure JWT Authentication

1. Go to **Routes** → Select route → **Security**
2. Add **JWT Authentication** filter
3. Configure JWT settings:
   ```yaml
   jwt:
     providers:
       - name: "auth0"
         issuer: "https://example.auth0.com/"
         audiences: ["api.example.com"]
         jwksUri: "https://example.auth0.com/.well-known/jwks.json"
   ```

#### Step 2: Add Authorization Policies

1. Add **Authorization** filter
2. Define access policies:
   ```yaml
   authorization:
     rules:
       - action: "ALLOW"
         when:
           - key: "jwt.sub"
             values: ["user123", "admin"]
   ```

---

## Multi-Environment Management

### Scenario 12: Managing Multiple Environments

#### Step 1: Create Environment Profiles

1. Navigate to **Environments** tab
2. Click **Add Environment**
3. Create profiles:
   - **Development**: `http://localhost:8080`
   - **Staging**: `https://staging.example.com`
   - **Production**: `https://api.example.com`

#### Step 2: Environment-Specific Configurations

1. Select **Development** environment
2. Configure development-specific settings:
   - Enable debug logging
   - Disable rate limiting
   - Set shorter timeouts

#### Step 3: Deploy Across Environments

1. Configure gateway in development
2. Use **Export Configuration** to save settings
3. Switch to staging environment
4. **Import Configuration** and adjust for staging
5. Deploy to production with production-optimized settings

---

## Troubleshooting

### Scenario 13: Common Issues and Solutions

#### Issue 1: Gateway Not Starting

**Symptoms**: Gateway status shows "Failed" or "Pending"

**Troubleshooting Steps**:
1. Check **Events** tab for error messages
2. Verify Kubernetes cluster is running
3. Check resource quotas and limits
4. Review gateway configuration for syntax errors

**Solution**:
```bash
# Check cluster status
kubectl cluster-info

# Verify Envoy Gateway installation
kubectl get pods -n envoy-gateway-system

# Check gateway events
kubectl describe gateway my-gateway
```

#### Issue 2: Routes Not Matching

**Symptoms**: 404 errors for configured routes

**Troubleshooting Steps**:
1. Verify route path patterns
2. Check hostname matching
3. Review route priority order
4. Test with curl to isolate issues

**Solution**:
1. Navigate to **Routes** → **Debugging**
2. Use **Route Matcher Test** tool
3. Input test request details
4. See which routes match and why

#### Issue 3: High Latency

**Symptoms**: Slow response times

**Troubleshooting Steps**:
1. Check backend service health
2. Review timeout configurations
3. Analyze load balancing behavior
4. Monitor resource utilization

**Solution**:
1. Use **Performance Analyzer** tool
2. Identify bottlenecks in request flow
3. Optimize timeout and retry settings
4. Scale backend services if needed

### Scenario 14: Debug Mode and Logging

#### Step 1: Enable Debug Logging

1. Go to **Gateway Settings** → **Logging**
2. Set log level to **Debug**
3. Enable access logs
4. Configure log format

#### Step 2: View Real-time Logs

1. Navigate to **Logs** tab
2. Filter logs by:
   - Log level
   - Time range
   - Route name
   - Error codes

#### Step 3: Export Logs for Analysis

1. Select time range for log export
2. Choose export format (JSON, CSV, Plain Text)
3. Download logs for external analysis

---

## Best Practices

### Configuration Best Practices

1. **Use Descriptive Names**: Name your gateways and routes clearly
2. **Start Simple**: Begin with basic configurations and add complexity gradually
3. **Version Your APIs**: Use path prefixes like `/api/v1/` for versioning
4. **Set Appropriate Timeouts**: Configure realistic timeout values
5. **Monitor from Day One**: Set up monitoring before going live

### Security Best Practices

1. **Always Use HTTPS**: Enable TLS for production environments
2. **Implement Rate Limiting**: Protect against abuse and DoS attacks
3. **Use JWT Authentication**: Implement proper authentication mechanisms
4. **Regular Security Audits**: Review and update security configurations
5. **Principle of Least Privilege**: Grant minimum necessary permissions

### Performance Best Practices

1. **Optimize Route Ordering**: Place most specific routes first
2. **Configure Circuit Breakers**: Prevent cascade failures
3. **Use Health Checks**: Implement proper health checking
4. **Monitor Key Metrics**: Track latency, throughput, and error rates
5. **Load Test Regularly**: Verify performance under load

### Operational Best Practices

1. **Backup Configurations**: Export and version control your configs
2. **Use Staging Environments**: Test changes before production
3. **Gradual Rollouts**: Implement canary deployments
4. **Document Changes**: Maintain change logs for configurations
5. **Regular Updates**: Keep the extension and Envoy Gateway updated

---

## Conclusion

This user guide covers the most common scenarios for using the Envoy Gateway Docker Desktop Extension. For additional help:

- Check the [FAQ](FAQ.md) for common questions
- Visit the [Troubleshooting Guide](TROUBLESHOOTING.md) for detailed issue resolution
- Join the community discussion on [GitHub](https://github.com/envoyproxy/gateway-docker-extension/discussions)

Remember to start with simple configurations and gradually add complexity as you become more familiar with the extension and Envoy Gateway capabilities.

---

*Last Updated: [Current Date]*  
*Version: 1.0*
