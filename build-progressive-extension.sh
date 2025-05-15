#!/bin/bash

# Envoy Gateway Extension - Progressive Build Script
# Build a working extension with core functionality

set -e

echo "🚀 Building Envoy Gateway Extension - Progressive Approach..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/saptak/code/envoy-gateway-docker-desktop-extension"
EXTENSION_DIR="$PROJECT_ROOT/envoy-gateway-extension"

echo -e "${YELLOW}📁 Setting up extension structure...${NC}"

# Ensure extension directory exists
mkdir -p "$EXTENSION_DIR"
cd "$EXTENSION_DIR"

# Create backend directory and files
mkdir -p backend/src

echo -e "${BLUE}🔧 Creating enhanced backend...${NC}"

# Create enhanced backend with core features
cat > backend/package.json << 'EOF'
{
  "name": "envoy-gateway-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "ws": "^8.13.0",
    "dockerode": "^4.0.2",
    "js-yaml": "^4.1.0",
    "axios": "^1.4.0"
  }
}
EOF

# Create enhanced backend server
cat > backend/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const Docker = require('dockerode');
const yaml = require('js-yaml');
const axios = require('axios');
const path = require('path');

const app = express();
const docker = new Docker();

app.use(cors());
app.use(express.json());

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// System status
app.get('/api/status', async (req, res) => {
  try {
    const dockerInfo = await docker.info();
    const containers = await docker.listContainers({ all: true });
    
    res.json({
      docker: {
        version: dockerInfo.ServerVersion,
        containers: containers.length,
        running: containers.filter(c => c.State === 'running').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gateway management endpoints
app.get('/api/gateways', async (req, res) => {
  try {
    // For now, return mock data - can be enhanced with real Kubernetes integration
    const gateways = [
      {
        id: 'gateway-1',
        name: 'example-gateway',
        namespace: 'default',
        status: 'Ready',
        listeners: [
          { name: 'http', protocol: 'HTTP', port: 80 },
          { name: 'https', protocol: 'HTTPS', port: 443 }
        ],
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({ gateways, total: gateways.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gateways', async (req, res) => {
  try {
    const { name, namespace, listeners } = req.body;
    
    // Mock gateway creation
    const gateway = {
      id: `gateway-${Date.now()}`,
      name,
      namespace: namespace || 'default',
      status: 'Pending',
      listeners: listeners || [],
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(gateway);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route management endpoints
app.get('/api/routes', async (req, res) => {
  try {
    const routes = [
      {
        id: 'route-1',
        name: 'example-route',
        namespace: 'default',
        parentRefs: [{ name: 'example-gateway', namespace: 'default' }],
        hostnames: ['example.com'],
        rules: [
          {
            matches: [{ path: { type: 'PathPrefix', value: '/' } }],
            backendRefs: [{ name: 'example-service', port: 8080 }]
          }
        ],
        status: 'Accepted',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({ routes, total: routes.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routes', async (req, res) => {
  try {
    const { name, namespace, parentRefs, hostnames, rules } = req.body;
    
    const route = {
      id: `route-${Date.now()}`,
      name,
      namespace: namespace || 'default',
      parentRefs: parentRefs || [],
      hostnames: hostnames || [],
      rules: rules || [],
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Envoy Gateway deployment
app.post('/api/envoy-gateway/deploy', async (req, res) => {
  try {
    console.log('Deploying Envoy Gateway...');
    
    // Mock deployment process
    const deployment = {
      status: 'success',
      message: 'Envoy Gateway deployment initiated',
      deploymentId: `deploy-${Date.now()}`,
      components: [
        { name: 'envoy-gateway-controller', status: 'deployed' },
        { name: 'envoy-proxy', status: 'deployed' },
        { name: 'gateway-class', status: 'created' }
      ]
    };
    
    res.json(deployment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Testing endpoint
app.post('/api/test-route', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    
    // Mock route testing
    const result = {
      success: true,
      status: 200,
      responseTime: Math.floor(Math.random() * 500) + 50,
      headers: {
        'content-type': 'application/json',
        'x-gateway': 'envoy-gateway'
      },
      body: { message: 'Test successful', timestamp: new Date().toISOString() }
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start HTTP server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Envoy Gateway Backend running on port ${PORT}`);
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Envoy Gateway Backend',
    timestamp: new Date().toISOString()
  }));
  
  // Send periodic status updates
  const statusInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          gateways: 1,
          routes: 1,
          status: 'running',
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, 5000);
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(statusInterval);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(statusInterval);
  });
});

console.log('WebSocket server started on the same port as HTTP server');
EOF

echo -e "${BLUE}🎨 Creating enhanced frontend...${NC}"

# Create frontend directory
mkdir -p ui

# Create enhanced HTML with React-like functionality
cat > ui/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Envoy Gateway</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 1rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 300;
            margin-bottom: 0.5rem;
        }

        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .status-bar {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .status-item {
            text-align: center;
        }

        .status-label {
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 0.25rem;
        }

        .status-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
        }

        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #4CAF50;
            display: inline-block;
            margin-left: 0.5rem;
        }

        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .card h2 {
            margin-bottom: 1rem;
            color: #333;
            font-size: 1.5rem;
        }

        .feature-list {
            list-style: none;
            padding: 0;
        }

        .feature-list li {
            padding: 0.75rem 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
        }

        .feature-list li:last-child {
            border-bottom: none;
        }

        .feature-icon {
            width: 24px;
            height: 24px;
            margin-right: 1rem;
            background: #667eea;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }

        .action-buttons {
            margin-top: 1.5rem;
            display: flex;
            gap: 1rem;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #333;
        }

        .btn-secondary:hover {
            background: #d1d9e0;
        }

        .logs-container {
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 1rem;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 1rem;
        }

        .log-entry {
            padding: 0.25rem 0;
            border-left: 3px solid transparent;
        }

        .log-entry.info {
            border-color: #667eea;
        }

        .log-entry.success {
            border-color: #4CAF50;
        }

        .log-entry.warning {
            border-color: #ff9800;
        }

        .log-timestamp {
            color: #888;
            margin-right: 1rem;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .metric-card {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
        }

        .metric-value {
            font-size: 2rem;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 0.25rem;
        }

        .metric-label {
            color: #666;
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .status-bar {
                flex-direction: column;
                gap: 1rem;
            }
        }

        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0.5rem 1rem;
            background: #4CAF50;
            color: white;
            border-radius: 20px;
            font-size: 0.875rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .connection-status.disconnected {
            background: #f44336;
        }
    </style>
</head>
<body>
    <div id="connectionStatus" class="connection-status">
        ● Connected
    </div>

    <div class="container">
        <header class="header">
            <h1>Envoy Gateway</h1>
            <p>Docker Desktop Extension for API Gateway Management</p>
        </header>

        <div class="status-bar">
            <div class="status-item">
                <div class="status-label">Backend Status</div>
                <div class="status-value" id="backendStatus">
                    Connected <span class="status-indicator"></span>
                </div>
            </div>
            <div class="status-item">
                <div class="status-label">Gateways</div>
                <div class="status-value" id="gatewayCount">1</div>
            </div>
            <div class="status-item">
                <div class="status-label">Routes</div>
                <div class="status-value" id="routeCount">1</div>
            </div>
            <div class="status-item">
                <div class="status-label">Last Updated</div>
                <div class="status-value" id="lastUpdated">Just now</div>
            </div>
        </div>

        <div class="main-content">
            <div class="card">
                <h2>Gateway Management</h2>
                <ul class="feature-list">
                    <li>
                        <div class="feature-icon">G</div>
                        <span>Create and manage Gateway resources</span>
                    </li>
                    <li>
                        <div class="feature-icon">R</div>
                        <span>Configure HTTP/HTTPS routes</span>
                    </li>
                    <li>
                        <div class="feature-icon">P</div>
                        <span>Attach traffic policies</span>
                    </li>
                    <li>
                        <div class="feature-icon">M</div>
                        <span>Monitor gateway status</span>
                    </li>
                </ul>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="deployEnvoyGateway()">
                        Deploy Envoy Gateway
                    </button>
                    <button class="btn btn-secondary" onclick="openGatewayManager()">
                        Manage Gateways
                    </button>
                </div>
            </div>

            <div class="card">
                <h2>Route Testing</h2>
                <ul class="feature-list">
                    <li>
                        <div class="feature-icon">T</div>
                        <span>Test HTTP routes</span>
                    </li>
                    <li>
                        <div class="feature-icon">H</div>
                        <span>Custom headers support</span>
                    </li>
                    <li>
                        <div class="feature-icon">L</div>
                        <span>Load testing scenarios</span>
                    </li>
                    <li>
                        <div class="feature-icon">R</div>
                        <span>Response analysis</span>
                    </li>
                </ul>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="testRoute()">
                        Test Route
                    </button>
                    <button class="btn btn-secondary" onclick="openTestConsole()">
                        Test Console
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Real-time Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value" id="requestCount">1,234</div>
                    <div class="metric-label">Total Requests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="responseTime">45ms</div>
                    <div class="metric-label">Avg Response Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="successRate">99.9%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="activeConnections">87</div>
                    <div class="metric-label">Active Connections</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Activity Logs</h2>
            <div class="logs-container" id="logsContainer">
                <div class="log-entry info">
                    <span class="log-timestamp">[INFO]</span>
                    <span>Envoy Gateway Extension loaded successfully</span>
                </div>
                <div class="log-entry success">
                    <span class="log-timestamp">[SUCCESS]</span>
                    <span>Connected to backend API</span>
                </div>
                <div class="log-entry info">
                    <span class="log-timestamp">[INFO]</span>
                    <span>WebSocket connection established</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let reconnectInterval = null;

        // Initialize the application
        function init() {
            setupWebSocket();
            fetchInitialData();
            updateTimestamp();
            setInterval(updateTimestamp, 30000); // Update every 30 seconds
        }

        // Setup WebSocket connection
        function setupWebSocket() {
            try {
                // Try to connect to the backend WebSocket
                ws = new WebSocket('ws://localhost:8080');
                
                ws.onopen = function() {
                    addLog('WebSocket connected', 'success');
                    updateConnectionStatus(true);
                    if (reconnectInterval) {
                        clearInterval(reconnectInterval);
                        reconnectInterval = null;
                    }
                };
                
                ws.onmessage = function(event) {
                    try {
                        const data = JSON.parse(event.data);
                        handleWebSocketMessage(data);
                    } catch (e) {
                        console.error('Error parsing WebSocket message:', e);
                    }
                };
                
                ws.onclose = function() {
                    addLog('WebSocket disconnected, attempting to reconnect...', 'warning');
                    updateConnectionStatus(false);
                    attemptReconnect();
                };
                
                ws.onerror = function(error) {
                    addLog('WebSocket error occurred', 'error');
                    updateConnectionStatus(false);
                };
            } catch (error) {
                console.error('WebSocket setup error:', error);
                updateConnectionStatus(false);
                attemptReconnect();
            }
        }

        // Handle WebSocket messages
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'connection':
                    addLog(data.message, 'info');
                    break;
                case 'status':
                    updateStatus(data.data);
                    break;
                default:
                    addLog(`Received: ${JSON.stringify(data)}`, 'info');
            }
        }

        // Attempt to reconnect WebSocket
        function attemptReconnect() {
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    addLog('Attempting to reconnect...', 'warning');
                    setupWebSocket();
                }, 5000);
            }
        }

        // Update connection status
        function updateConnectionStatus(connected) {
            const statusEl = document.getElementById('connectionStatus');
            const backendStatusEl = document.getElementById('backendStatus');
            
            if (connected) {
                statusEl.textContent = '● Connected';
                statusEl.className = 'connection-status';
                backendStatusEl.innerHTML = 'Connected <span class="status-indicator"></span>';
            } else {
                statusEl.textContent = '● Disconnected';
                statusEl.className = 'connection-status disconnected';
                backendStatusEl.innerHTML = 'Disconnected <span class="status-indicator" style="background-color: #f44336;"></span>';
            }
        }

        // Fetch initial data from the backend
        async function fetchInitialData() {
            try {
                // Check health
                const healthResponse = await fetch('/api/health');
                if (healthResponse.ok) {
                    addLog('Backend health check passed', 'success');
                }
                
                // Fetch gateways and routes
                const gatewaysResponse = await fetch('/api/gateways');
                const routesResponse = await fetch('/api/routes');
                
                if (gatewaysResponse.ok && routesResponse.ok) {
                    const gateways = await gatewaysResponse.json();
                    const routes = await routesResponse.json();
                    
                    document.getElementById('gatewayCount').textContent = gateways.total || 0;
                    document.getElementById('routeCount').textContent = routes.total || 0;
                    
                    addLog(`Loaded ${gateways.total} gateways and ${routes.total} routes`, 'info');
                }
            } catch (error) {
                addLog('Failed to fetch initial data: ' + error.message, 'warning');
            }
        }

        // Update status from WebSocket
        function updateStatus(status) {
            if (status.gateways !== undefined) {
                document.getElementById('gatewayCount').textContent = status.gateways;
            }
            if (status.routes !== undefined) {
                document.getElementById('routeCount').textContent = status.routes;
            }
            updateTimestamp();
        }

        // Update timestamp
        function updateTimestamp() {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            document.getElementById('lastUpdated').textContent = timeString;
        }

        // Add log entry
        function addLog(message, type = 'info') {
            const logsContainer = document.getElementById('logsContainer');
            const timestamp = new Date().toLocaleTimeString();
            
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span><span>${message}</span>`;
            
            logsContainer.appendChild(logEntry);
            logsContainer.scrollTop = logsContainer.scrollHeight;
            
            // Keep only last 50 log entries
            while (logsContainer.children.length > 50) {
                logsContainer.removeChild(logsContainer.firstChild);
            }
        }

        // Action handlers
        async function deployEnvoyGateway() {
            addLog('Initiating Envoy Gateway deployment...', 'info');
            
            try {
                const response = await fetch('/api/envoy-gateway/deploy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    addLog('Envoy Gateway deployment successful', 'success');
                    addLog(`Deployment ID: ${result.deploymentId}`, 'info');
                } else {
                    addLog('Deployment failed', 'error');
                }
            } catch (error) {
                addLog('Deployment error: ' + error.message, 'error');
            }
        }

        async function testRoute() {
            addLog('Testing route...', 'info');
            
            try {
                const response = await fetch('/api/test-route', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: 'http://example.com',
                        method: 'GET',
                        headers: {},
                        body: null
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    addLog(`Route test completed: ${result.status} (${result.responseTime}ms)`, 'success');
                    
                    // Update metrics with test result
                    document.getElementById('responseTime').textContent = `${result.responseTime}ms`;
                } else {
                    addLog('Route test failed', 'error');
                }
            } catch (error) {
                addLog('Test error: ' + error.message, 'error');
            }
        }

        function openGatewayManager() {
            addLog('Opening Gateway Manager...', 'info');
            // This would open a detailed gateway management interface
            alert('Gateway Manager would open here (feature in development)');
        }

        function openTestConsole() {
            addLog('Opening Test Console...', 'info');
            // This would open a testing interface
            alert('Test Console would open here (feature in development)');
        }

        // Simulate some metrics updates
        function updateMetrics() {
            // Update request count
            const requestCount = document.getElementById('requestCount');
            const current = parseInt(requestCount.textContent.replace(',', ''));
            requestCount.textContent = (current + Math.floor(Math.random() * 10)).toLocaleString();
            
            // Update success rate
            const successRate = 99.5 + (Math.random() * 0.4);
            document.getElementById('successRate').textContent = `${successRate.toFixed(1)}%`;
            
            // Update active connections
            const connections = 80 + Math.floor(Math.random() * 20);
            document.getElementById('activeConnections').textContent = connections;
        }

        // Update metrics every 10 seconds
        setInterval(updateMetrics, 10000);

        // Initialize when page loads
        window.addEventListener('load', init);
    </script>
</body>
</html>
EOF

echo -e "${BLUE}🐳 Creating Dockerfile...${NC}"

# Create optimized Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bash

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --only=production

# Copy backend source
COPY backend/src ./src

# Copy frontend
WORKDIR /app
COPY ui ./ui

# Copy icon
COPY icon.svg .

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && node src/index.js &' >> /app/start.sh && \
    echo 'cd /app && python3 -m http.server 80 --directory ui &' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Install Python for serving static files
RUN apk add --no-cache python3

EXPOSE 80 8080

# Add Docker extension labels
LABEL org.opencontainers.image.title="Envoy Gateway"
LABEL org.opencontainers.image.description="Docker Desktop extension for Envoy Gateway management"
LABEL org.opencontainers.image.vendor="Envoy Gateway Community"
LABEL com.docker.desktop.extension.api.version="0.3.4"

CMD ["/app/start.sh"]
EOF

echo -e "${BLUE}📝 Creating metadata.json...${NC}"

# Create metadata.json
cat > metadata.json << 'EOF'
{
  "icon": "icon.svg",
  "vm": {
    "image": "envoy-gateway-extension:latest"
  },
  "ui": {
    "dashboard-tab": {
      "title": "Envoy Gateway",
      "src": "index.html",
      "root": "ui"
    }
  },
  "host": {
    "binaries": []
  }
}
EOF

echo -e "${YELLOW}🔨 Building Docker image...${NC}"

# Build the Docker image
docker build -t envoy-gateway-extension:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    
    # Ask if user wants to install
    read -p "Would you like to install the extension now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🔄 Uninstalling existing extension...${NC}"
        docker extension uninstall envoy-gateway-extension 2>/dev/null || true
        
        echo -e "${YELLOW}📦 Installing new extension...${NC}"
        docker extension install envoy-gateway-extension:latest
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}🎉 Extension installed successfully!${NC}"
            echo -e "${GREEN}You can now access it from the Docker Desktop Extensions tab${NC}"
        else
            echo -e "${RED}❌ Installation failed${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Script completed${NC}"
