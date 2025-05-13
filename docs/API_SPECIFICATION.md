# API Specification - Envoy Gateway Docker Desktop Extension

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Gateway Management API](#gateway-management-api)
4. [Configuration API](#configuration-api)
5. [Testing API](#testing-api)
6. [Monitoring API](#monitoring-api)
7. [WebSocket Events](#websocket-events)
8. [Error Handling](#error-handling)

---

## 1. Overview

The Envoy Gateway Docker Desktop Extension API provides RESTful endpoints for managing Envoy Gateway configurations, executing tests, and monitoring gateway instances.

**Base URL**: `http://localhost:3000/api`

**API Version**: v1

**Content Type**: `application/json`

---

## 2. Authentication

All API requests require authentication using either API keys or JWT tokens.

### API Key Authentication
```http
X-API-Key: your-api-key-here
```

### JWT Authentication
```http
Authorization: Bearer <jwt-token>
```

---

## 3. Gateway Management API

### 3.1 Deploy Envoy Gateway

Deploy a new Envoy Gateway instance.

```http
POST /api/v1/gateway/deploy
```

**Request Body:**
```json
{
  "name": "my-gateway",
  "mode": "kubernetes|standalone",
  "namespace": "default",
  "config": {
    "image": "envoyproxy/gateway:v1.2.0",
    "replicas": 1,
    "resources": {
      "requests": {
        "cpu": "100m",
        "memory": "128Mi"
      },
      "limits": {
        "cpu": "500m",
        "memory": "512Mi"
      }
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "deploymentId": "gw-12345",
    "name": "my-gateway",
    "status": "deploying",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.2 Get Gateway Status

Get the status of an Envoy Gateway instance.

```http
GET /api/v1/gateway/{gatewayId}/status
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "gw-12345",
    "name": "my-gateway",
    "status": "running",
    "health": "healthy",
    "version": "v1.2.0",
    "endpoints": [
      {
        "name": "http",
        "port": 8080,
        "protocol": "HTTP",
        "url": "http://localhost:8080"
      }
    ],
    "metrics": {
      "requestCount": 1234,
      "errorRate": 0.02,
      "avgResponseTime": 150
    }
  }
}
```

### 3.3 List Gateways

List all deployed Envoy Gateway instances.

```http
GET /api/v1/gateway
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "gw-12345",
      "name": "my-gateway",
      "status": "running",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 3.4 Delete Gateway

Delete an Envoy Gateway instance.

```http
DELETE /api/v1/gateway/{gatewayId}
```

**Response:**
```json
{
  "status": "success",
  "message": "Gateway deleted successfully"
}
```

---

## 4. Configuration API

### 4.1 Create GatewayClass

Create a new GatewayClass resource.

```http
POST /api/v1/config/gatewayclass
```

**Request Body:**
```json
{
  "name": "eg",
  "controllerName": "envoygateway.io/gateway-controller",
  "description": "Standard Envoy Gateway class"
}
```

### 4.2 Create Gateway

Create a new Gateway resource.

```http
POST /api/v1/config/gateway
```

**Request Body:**
```json
{
  "name": "my-gateway",
  "namespace": "default",
  "gatewayClassName": "eg",
  "listeners": [
    {
      "name": "http",
      "port": 80,
      "protocol": "HTTP",
      "hostname": "*.example.com"
    }
  ]
}
```

### 4.3 Create HTTPRoute

Create a new HTTPRoute resource.

```http
POST /api/v1/config/httproute
```

**Request Body:**
```json
{
  "name": "my-route",
  "namespace": "default",
  "parentRefs": [
    {
      "name": "my-gateway"
    }
  ],
  "hostnames": ["api.example.com"],
  "rules": [
    {
      "matches": [
        {
          "path": {
            "type": "PathPrefix",
            "value": "/api"
          }
        }
      ],
      "backendRefs": [
        {
          "name": "my-service",
          "port": 8080
        }
      ]
    }
  ]
}
```

### 4.4 List Configurations

List all Gateway API resources.

```http
GET /api/v1/config
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "gateways": [...],
    "httpRoutes": [...],
    "grpcRoutes": [...],
    "policies": [...]
  }
}
```

### 4.5 Validate Configuration

Validate Gateway API configuration.

```http
POST /api/v1/config/validate
```

**Request Body:**
```json
{
  "type": "Gateway",
  "spec": {
    "gatewayClassName": "eg",
    "listeners": [...]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [
      "Consider enabling TLS for production use"
    ]
  }
}
```

---

## 5. Testing API

### 5.1 Execute HTTP Test

Execute a single HTTP test against a configured route.

```http
POST /api/v1/test/http
```

**Request Body:**
```json
{
  "method": "GET",
  "url": "http://localhost:8080/api/users",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  "body": null,
  "timeout": 5000,
  "followRedirects": true
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "requestId": "req-12345",
    "success": true,
    "statusCode": 200,
    "headers": {
      "content-type": "application/json"
    },
    "body": {
      "users": [...]
    },
    "responseTime": 145,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 5.2 Run Load Test

Execute a load test scenario.

```http
POST /api/v1/test/load
```

**Request Body:**
```json
{
  "name": "API Load Test",
  "duration": 60,
  "concurrency": 10,
  "rampUp": 5,
  "scenario": {
    "method": "GET",
    "url": "http://localhost:8080/api/health",
    "headers": {},
    "body": null
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "testId": "load-12345",
    "status": "running",
    "startTime": "2024-01-01T00:00:00Z",
    "estimatedEndTime": "2024-01-01T00:01:00Z"
  }
}
```

### 5.3 Get Test Results

Get results of a completed test.

```http
GET /api/v1/test/{testId}/results
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "testId": "load-12345",
    "status": "completed",
    "metrics": {
      "totalRequests": 600,
      "successfulRequests": 595,
      "failedRequests": 5,
      "averageResponseTime": 120,
      "p50ResponseTime": 100,
      "p90ResponseTime": 200,
      "p99ResponseTime": 350,
      "throughput": 10.0,
      "errorRate": 0.0083
    },
    "timeline": [
      {
        "timestamp": "2024-01-01T00:00:10Z",
        "rps": 9.8,
        "latency": 115,
        "errors": 0
      }
    ]
  }
}
```

### 5.4 List Test History

Get history of executed tests.

```http
GET /api/v1/test/history?limit=10&offset=0
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "tests": [
      {
        "id": "test-12345",
        "name": "API Health Check",
        "type": "http",
        "status": "completed",
        "success": true,
        "executedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 6. Monitoring API

### 6.1 Get Gateway Metrics

Get real-time metrics for a gateway.

```http
GET /api/v1/monitor/gateway/{gatewayId}/metrics
```

**Query Parameters:**
- `timeRange`: Time range for metrics (1h, 24h, 7d, 30d)
- `step`: Data point interval (1m, 5m, 1h)

**Response:**
```json
{
  "status": "success",
  "data": {
    "timestamp": "2024-01-01T00:00:00Z",
    "metrics": {
      "requestRate": {
        "current": 100.5,
        "peak": 250.0,
        "average": 85.2
      },
      "errorRate": {
        "current": 0.02,
        "peak": 0.15,
        "average": 0.03
      },
      "latency": {
        "p50": 120,
        "p90": 280,
        "p99": 450
      },
      "activeConnections": 45,
      "totalConnections": 1250
    },
    "timeseries": {
      "requests": [
        {
          "timestamp": "2024-01-01T00:00:00Z",
          "value": 98.5
        }
      ],
      "errors": [...],
      "latency": [...]
    }
  }
}
```

### 6.2 Get Access Logs

Retrieve access logs with filtering.

```http
GET /api/v1/monitor/gateway/{gatewayId}/logs
```

**Query Parameters:**
- `level`: Log level (error, warn, info, debug)
- `since`: Start time (RFC3339 format)
- `until`: End time (RFC3339 format)
- `limit`: Number of log entries (default: 100)
- `search`: Search term

**Response:**
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "level": "info",
        "message": "Request processed successfully",
        "fields": {
          "method": "GET",
          "path": "/api/users",
          "status": 200,
          "responseTime": "145ms",
          "userAgent": "curl/7.68.0"
        }
      }
    ],
    "total": 1250,
    "hasMore": true
  }
}
```

### 6.3 Get System Health

Get overall system health status.

```http
GET /api/v1/monitor/health
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "overall": "healthy",
    "checks": {
      "extension": {
        "status": "healthy",
        "lastCheck": "2024-01-01T00:00:00Z"
      },
      "envoyGateway": {
        "status": "healthy",
        "lastCheck": "2024-01-01T00:00:00Z",
        "version": "v1.2.0"
      },
      "docker": {
        "status": "healthy",
        "lastCheck": "2024-01-01T00:00:00Z"
      },
      "kubernetes": {
        "status": "healthy",
        "lastCheck": "2024-01-01T00:00:00Z",
        "context": "docker-desktop"
      }
    }
  }
}
```

---

## 7. WebSocket Events

The extension uses WebSocket connections for real-time updates.

**WebSocket URL**: `ws://localhost:3000/api/ws`

### Event Types

#### Metrics Update
```json
{
  "type": "metrics",
  "gatewayId": "gw-12345",
  "data": {
    "requestRate": 105.2,
    "errorRate": 0.01,
    "latency": {
      "p50": 115,
      "p90": 270,
      "p99": 440
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Configuration Change
```json
{
  "type": "configChange",
  "resourceType": "HTTPRoute",
  "resourceName": "my-route",
  "action": "created|updated|deleted",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Test Update
```json
{
  "type": "testUpdate",
  "testId": "test-12345",
  "status": "running|completed|failed",
  "progress": 75,
  "data": {
    "currentRps": 9.8,
    "totalRequests": 450,
    "errors": 2
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### System Alert
```json
{
  "type": "alert",
  "severity": "info|warning|error|critical",
  "title": "High Error Rate Detected",
  "message": "Error rate has exceeded 5% threshold",
  "gatewayId": "gw-12345",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 8. Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid configuration provided",
    "details": {
      "field": "listeners[0].port",
      "reason": "Port must be between 1 and 65535"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-12345"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, malformed request)
- `401` - Unauthorized (invalid or missing authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (semantic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication credentials invalid |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RESOURCE_CONFLICT` | Resource already exists |
| `GATEWAY_ERROR` | Envoy Gateway operation failed |
| `KUBERNETES_ERROR` | Kubernetes API operation failed |
| `DOCKER_ERROR` | Docker operation failed |
| `NETWORK_ERROR` | Network communication failed |
| `TIMEOUT_ERROR` | Operation timed out |
| `INTERNAL_ERROR` | Unexpected server error |

### Retry Logic

For transient errors (5xx responses), implement exponential backoff:

```javascript
const retryRequest = async (url, options, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default Limit**: 100 requests per minute per API key
- **Burst Limit**: 20 requests per 10 seconds
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

When rate limit is exceeded:

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "retryAfter": 60
  }
}
```

---

## API Versioning

The API uses URL versioning:
- Current version: `/api/v1/`
- Legacy version support: `/api/v0/` (deprecated)

Version compatibility:
- **v1**: Current stable version
- **v2**: Future version (planned features)

Breaking changes will result in a new version number, with backward compatibility maintained for at least one major version.
