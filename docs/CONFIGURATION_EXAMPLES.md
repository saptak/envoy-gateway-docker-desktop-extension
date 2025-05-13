# Configuration Examples

This document provides practical configuration examples for common Envoy Gateway scenarios using the Docker Desktop Extension.

## Table of Contents

1. [Basic Configurations](#basic-configurations)
2. [Routing Scenarios](#routing-scenarios)
3. [Security Configurations](#security-configurations)
4. [Load Balancing](#load-balancing)
5. [Observability](#observability)
6. [Advanced Use Cases](#advanced-use-cases)

---

## Basic Configurations

### 1. Simple HTTP Gateway

**Use Case**: Basic HTTP gateway for development

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: simple-gateway
  namespace: default
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: http
    protocol: HTTP
    port: 8080
```

**Extension Configuration**:
- Gateway Name: `simple-gateway`
- Protocol: `HTTP`
- Port: `8080`
- Namespace: `default`

### 2. HTTPS Gateway with TLS

**Use Case**: Production gateway with SSL termination

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: https-gateway
  namespace: default
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      certificateRefs:
      - name: example-com-tls
        kind: Secret
  - name: http-redirect
    protocol: HTTP
    port: 80
```

**Extension Steps**:
1. Upload TLS certificate in Security → TLS
2. Create HTTPS listener on port 443
3. Add HTTP redirect listener on port 80
4. Configure certificate reference

---

## Routing Scenarios

### 3. Path-Based Routing

**Use Case**: Route different paths to different services

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: path-based-routing
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/
    backendRefs:
    - name: api-service
      port: 8080
  - matches:
    - path:
        type: PathPrefix
        value: /admin/
    backendRefs:
    - name: admin-service
      port: 3000
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: frontend-service
      port: 80
```

**Extension Configuration**:
1. Create route: `api-route`
   - Path: `/api/*`
   - Backend: `api-service:8080`
2. Create route: `admin-route`
   - Path: `/admin/*`
   - Backend: `admin-service:3000`
3. Create route: `frontend-route`
   - Path: `/`
   - Backend: `frontend-service:80`

### 4. Header-Based Routing

**Use Case**: Route based on request headers (A/B testing)

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: header-routing
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - headers:
      - name: X-Version
        value: v2
    - path:
        type: PathPrefix
        value: /api/
    backendRefs:
    - name: api-v2-service
      port: 8080
  - matches:
    - path:
        type: PathPrefix
        value: /api/
    backendRefs:
    - name: api-v1-service
      port: 8080
```

**Extension Configuration**:
1. Create route with header matching:
   - Path: `/api/*`
   - Header: `X-Version: v2`
   - Backend: `api-v2-service:8080`
2. Create fallback route:
   - Path: `/api/*`
   - Backend: `api-v1-service:8080`

### 5. Host-Based Routing

**Use Case**: Multi-tenant application with different domains

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: host-based-routing
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  hostnames:
  - api.example.com
  rules:
  - backendRefs:
    - name: api-service
      port: 8080
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: admin-host-routing
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  hostnames:
  - admin.example.com
  rules:
  - backendRefs:
    - name: admin-service
      port: 3000
```

**Extension Configuration**:
1. Create route for API:
   - Hostname: `api.example.com`
   - Backend: `api-service:8080`
2. Create route for Admin:
   - Hostname: `admin.example.com`
   - Backend: `admin-service:3000`

---

## Security Configurations

### 6. JWT Authentication

**Use Case**: Protect APIs with JWT tokens

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: jwt-protected-route
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /protected/
    filters:
    - type: ExtensionRef
      extensionRef:
        group: gateway.envoyproxy.io
        kind: SecurityPolicy
        name: jwt-auth-policy
    backendRefs:
    - name: protected-service
      port: 8080
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: jwt-auth-policy
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: jwt-protected-route
  jwt:
    providers:
    - name: auth0
      issuer: https://example.auth0.com/
      audiences:
      - api.example.com
      remoteJWKS:
        uri: https://example.auth0.com/.well-known/jwks.json
```

**Extension Configuration**:
1. Create route for protected path:
   - Path: `/protected/*`
   - Backend: `protected-service:8080`
2. Add JWT authentication filter:
   - Provider: `auth0`
   - Issuer: `https://example.auth0.com/`
   - Audience: `api.example.com`
   - JWKS URI: `https://example.auth0.com/.well-known/jwks.json`

### 7. Rate Limiting

**Use Case**: Protect APIs from abuse with rate limiting

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: rate-limited-route
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/
    filters:
    - type: ExtensionRef
      extensionRef:
        group: gateway.envoyproxy.io
        kind: RateLimitPolicy
        name: api-rate-limit
    backendRefs:
    - name: api-service
      port: 8080
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: RateLimitPolicy
metadata:
  name: api-rate-limit
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: rate-limited-route
  rateLimits:
  - clientSelectors:
    - headers:
      - name: x-user-id
        value: "*"
    limits:
      rpm: 100
```

**Extension Configuration**:
1. Create route: `/api/*`
2. Add rate limiting filter:
   - Limit: `100 requests per minute`
   - Key: `Client IP`
   - Burst allowance: `10`

### 8. CORS Configuration

**Use Case**: Enable cross-origin requests for web applications

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: cors-enabled-route
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/
    filters:
    - type: ResponseHeaderModifier
      responseHeaderModifier:
        add:
        - name: Access-Control-Allow-Origin
          value: "*"
        - name: Access-Control-Allow-Methods
          value: GET,POST,PUT,DELETE,OPTIONS
        - name: Access-Control-Allow-Headers
          value: Content-Type,Authorization
    backendRefs:
    - name: api-service
      port: 8080
```

**Extension Configuration**:
1. Create route for API
2. Add response header modifier:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type,Authorization`

---

## Load Balancing

### 9. Weighted Load Balancing

**Use Case**: Canary deployment with traffic splitting

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: weighted-routing
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: app-v1
      port: 8080
      weight: 90
    - name: app-v2
      port: 8080
      weight: 10
```

**Extension Configuration**:
1. Create route with multiple backends:
   - Backend 1: `app-v1:8080` (Weight: 90%)
   - Backend 2: `app-v2:8080` (Weight: 10%)

### 10. Health Check Configuration

**Use Case**: Automatic failover with health checks

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: health-check-policy
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: health-checked-route
  healthCheck:
    active:
      type: HTTP
      http:
        path: /health
        timeout: 1s
      interval: 5s
      unhealthyThreshold: 3
      healthyThreshold: 1
```

**Extension Configuration**:
1. Enable health checks for backend
2. Configure health check settings:
   - Path: `/health`
   - Interval: `5 seconds`
   - Healthy threshold: `1`
   - Unhealthy threshold: `3`

---

## Observability

### 11. Distributed Tracing

**Use Case**: Enable request tracing across services

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: envoy-gateway-config
  namespace: envoy-gateway-system
data:
  envoy-gateway.yaml: |
    apiVersion: gateway.envoyproxy.io/v1alpha1
    kind: EnvoyGateway
    provider:
      type: Kubernetes
    gateway:
      controllerName: gateway.envoyproxy.io/gatewayclass-controller
    telemetry:
      tracing:
        provider:
          type: OpenTelemetry
          openTelemetry:
            endpoint: http://jaeger:14268/api/traces
```

**Extension Configuration**:
1. Navigate to Gateway Settings → Observability
2. Enable distributed tracing
3. Configure tracing endpoint: `http://jaeger:14268/api/traces`
4. Set sampling rate: `100%` for development

### 12. Custom Metrics

**Use Case**: Track custom application metrics

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyPatchPolicy
metadata:
  name: custom-metrics
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: simple-gateway
  type: JSONPatch
  jsonPatches:
  - type: type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
    name: custom-metrics-filter
    operation:
      op: add
      path: /typed_config
      value:
        config:
          configuration:
            metrics:
            - name: request_size
              expression: request.size()
            - name: response_size
              expression: response.size()
```

**Extension Configuration**:
1. Use Advanced → Custom Filters
2. Add metrics collection filter
3. Define custom metrics expressions

---

## Advanced Use Cases

### 13. Circuit Breaker

**Use Case**: Prevent cascade failures with circuit breaking

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: circuit-breaker-policy
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: circuit-breaker-route
  circuitBreaker:
    maxConnections: 100
    maxPendingRequests: 10
    maxRequests: 100
    maxRetries: 3
    splitExternalLocalOriginErrors: true
```

**Extension Configuration**:
1. Navigate to route → Advanced → Circuit Breaker
2. Configure thresholds:
   - Max connections: `100`
   - Max pending requests: `10`
   - Max requests: `100`
   - Max retries: `3`

### 14. Request/Response Transformation

**Use Case**: Modify requests and responses on the fly

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: transformation-route
  namespace: default
spec:
  parentRefs:
  - name: simple-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/
    filters:
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: X-Custom-Header
          value: "gateway-added"
        remove:
        - X-Internal-Token
    - type: ResponseHeaderModifier
      responseHeaderModifier:
        add:
        - name: X-Response-Time
          value: "%RESPONSE_DURATION%"
    backendRefs:
    - name: api-service
      port: 8080
```

**Extension Configuration**:
1. Add request header modifier:
   - Add: `X-Custom-Header: gateway-added`
   - Remove: `X-Internal-Token`
2. Add response header modifier:
   - Add: `X-Response-Time: %RESPONSE_DURATION%`

### 15. External Authorization

**Use Case**: Integrate with external auth service

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: external-auth-policy
  namespace: default
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: external-auth-route
  extAuth:
    http:
      backendRef:
        name: auth-service
        port: 9000
      path: /auth/verify
      headersToBackend:
      - Authorization
      - X-User-ID
      headersToDownstream:
      - X-Auth-User
      - X-Auth-Roles
```

**Extension Configuration**:
1. Navigate to Security → External Authorization
2. Configure auth service:
   - Service: `auth-service:9000`
   - Path: `/auth/verify`
3. Configure header forwarding

---

## Configuration Templates

### Development Template

```yaml
# Quick development setup
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: dev-gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: http
    protocol: HTTP
    port: 8080
    allowedRoutes:
      namespaces:
        from: All
```

### Production Template

```yaml
# Production-ready configuration
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: prod-gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      certificateRefs:
      - name: prod-tls-cert
    allowedRoutes:
      namespaces:
        from: Selector
        selector:
          matchLabels:
            environment: production
```

## Best Practices

1. **Start Simple**: Begin with basic configurations and add complexity gradually
2. **Use Templates**: Leverage the extension's template gallery for common patterns
3. **Test Thoroughly**: Use the built-in testing tools before deploying changes
4. **Monitor Always**: Enable observability features from day one
5. **Version Control**: Export and version your gateway configurations
6. **Security First**: Always implement appropriate security measures for production

---

For more detailed explanations of these configurations, refer to the [User Guide](USER_GUIDE.md) and [API Reference](API_REFERENCE.md).
