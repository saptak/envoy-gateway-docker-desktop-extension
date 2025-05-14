export interface Gateway {
  id: string;
  name: string;
  namespace: string;
  gatewayClassName: string;
  listeners: GatewayListener[];
  addresses?: GatewayAddress[];
  status: GatewayStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayListener {
  name: string;
  hostname?: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TLS' | 'TCP' | 'UDP';
  tls?: TLSConfig;
  allowedRoutes?: {
    namespaces?: {
      from: 'All' | 'Same' | 'Selector';
      selector?: Record<string, string>;
    };
    kinds?: Array<{
      group: string;
      kind: string;
    }>;
  };
}

export interface TLSConfig {
  mode: 'Terminate' | 'Passthrough';
  certificateRefs?: Array<{
    name: string;
    namespace?: string;
  }>;
}

export interface GatewayAddress {
  type: 'IPAddress' | 'Hostname';
  value: string;
}

export interface GatewayStatus {
  addresses: GatewayAddress[];
  conditions: Condition[];
  listeners: ListenerStatus[];
}

export interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransitionTime: string;
}

export interface ListenerStatus {
  name: string;
  supportedKinds: Array<{
    group: string;
    kind: string;
  }>;
  attachedRoutes: number;
  conditions: Condition[];
}

export interface HTTPRoute {
  id: string;
  name: string;
  namespace: string;
  parentRefs: ParentRef[];
  hostnames?: string[];
  rules: HTTPRouteRule[];
  status: HTTPRouteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ParentRef {
  group?: string;
  kind?: string;
  namespace?: string;
  name: string;
  sectionName?: string;
  port?: number;
}

export interface HTTPRouteRule {
  matches?: HTTPRouteMatch[];
  filters?: HTTPRouteFilter[];
  backendRefs?: HTTPBackendRef[];
  timeouts?: HTTPRouteTimeouts;
}

export interface HTTPRouteMatch {
  path?: {
    type: 'Exact' | 'PathPrefix' | 'RegularExpression';
    value: string;
  };
  headers?: Array<{
    type: 'Exact' | 'RegularExpression';
    name: string;
    value: string;
  }>;
  queryParams?: Array<{
    type: 'Exact' | 'RegularExpression';
    name: string;
    value: string;
  }>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';
}

export interface HTTPRouteFilter {
  type: 'RequestHeaderModifier' | 'ResponseHeaderModifier' | 'RequestMirror' | 'RequestRedirect' | 'URLRewrite' | 'ExtensionRef';
  requestHeaderModifier?: {
    set?: Array<{ name: string; value: string }>;
    add?: Array<{ name: string; value: string }>;
    remove?: string[];
  };
  responseHeaderModifier?: {
    set?: Array<{ name: string; value: string }>;
    add?: Array<{ name: string; value: string }>;
    remove?: string[];
  };
  requestRedirect?: {
    scheme?: string;
    hostname?: string;
    path?: {
      type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
      replaceFullPath?: string;
      replacePrefixMatch?: string;
    };
    port?: number;
    statusCode?: 301 | 302;
  };
  urlRewrite?: {
    hostname?: string;
    path?: {
      type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
      replaceFullPath?: string;
      replacePrefixMatch?: string;
    };
  };
}

export interface HTTPBackendRef {
  group?: string;
  kind?: string;
  name: string;
  namespace?: string;
  port?: number;
  weight?: number;
  filters?: HTTPRouteFilter[];
}

export interface HTTPRouteTimeouts {
  request?: string;
  backendRequest?: string;
}

export interface HTTPRouteStatus {
  parents: RouteParentStatus[];
}

export interface RouteParentStatus {
  parentRef: ParentRef;
  controllerName: string;
  conditions: Condition[];
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  imageId: string;
  state: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';
  status: string;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: 'tcp' | 'udp';
    ip?: string;
  }>;
  labels: Record<string, string>;
  created: number;
  mounts: Array<{
    type: 'bind' | 'volume' | 'tmpfs';
    source: string;
    destination: string;
    mode: string;
    rw: boolean;
    propagation: string;
  }>;
  networks: Record<string, {
    networkId: string;
    endpointId: string;
    gateway: string;
    ipAddress: string;
    ipPrefixLen: number;
    ipv6Gateway: string;
    globalIPv6Address: string;
    globalIPv6PrefixLen: number;
    macAddress: string;
  }>;
}

export interface SystemStatus {
  docker: {
    connected: boolean;
    version?: string;
    platform?: string;
    containers: {
      running: number;
      stopped: number;
      total: number;
    };
  };
  kubernetes: {
    connected: boolean;
    version?: string;
    context?: string;
    namespace: string;
  };
  envoyGateway: {
    installed: boolean;
    version?: string;
    namespace?: string;
    status: 'pending' | 'running' | 'error' | 'unknown';
  };
}

export interface MonitoringMetrics {
  timestamp: number;
  gateways: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  routes: {
    total: number;
    attached: number;
    detached: number;
  };
  traffic: {
    requestRate: number;
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
  };
  resources: {
    cpu: {
      usage: number;
      limit: number;
    };
    memory: {
      usage: number;
      limit: number;
    };
  };
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ConfigTemplateSpec {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: Record<string, any>;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: 'gateway' | 'route' | 'policy' | 'security';
  tags: string[];
  spec: ConfigTemplateSpec;
  examples?: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  expectedStatus: number;
  expectedHeaders?: Record<string, string>;
  expectedBody?: string;
  timeout?: number;
}

export interface TestCollection {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  variables?: Record<string, string>;
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  actualStatus?: number;
  actualHeaders?: Record<string, string>;
  actualBody?: string;
  error?: string;
  assertions?: Array<{
    description: string;
    passed: boolean;
    error?: string;
  }>;
}

export interface TestRun {
  id: string;
  collectionId: string;
  timestamp: number;
  status: 'running' | 'completed' | 'failed';
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  activeTab: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'status_update' | 'gateway_changed' | 'route_changed' | 'metrics_update' | 'log_entry';
  data: any;
  timestamp: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
