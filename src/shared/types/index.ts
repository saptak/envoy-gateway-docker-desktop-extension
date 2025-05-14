// Shared types for the Envoy Gateway Docker Desktop Extension

export interface Gateway {
  id: string;
  name: string;
  namespace: string;
  status: GatewayStatus;
  listeners: Listener[];
  createdAt: Date;
  updatedAt: Date;
  spec: GatewaySpec;
  conditions?: GatewayCondition[];
}

export interface GatewaySpec {
  gatewayClassName: string;
  listeners: ListenerSpec[];
  addresses?: GatewayAddress[];
}

export interface ListenerSpec {
  name: string;
  hostname?: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TLS' | 'TCP' | 'UDP';
  tls?: TLSConfig;
  allowedRoutes?: AllowedRoutes;
}

export interface TLSConfig {
  mode?: 'Terminate' | 'Passthrough';
  certificateRefs?: CertificateRef[];
  options?: Record<string, string>;
}

export interface CertificateRef {
  name: string;
  namespace?: string;
  kind?: string;
  group?: string;
}

export interface AllowedRoutes {
  namespaces?: {
    from: 'All' | 'Selector' | 'Same';
    selector?: Record<string, string>;
  };
  kinds?: {
    group?: string;
    kind: string;
  }[];
}

export interface GatewayAddress {
  type?: string;
  value: string;
}

export interface Listener {
  name: string;
  hostname?: string;
  port: number;
  protocol: string;
  attachedRoutes: number;
  conditions: ListenerCondition[];
}

export interface ListenerCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransitionTime: Date;
}

export interface GatewayCondition {
  type: 'Accepted' | 'Programmed' | 'Ready';
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransitionTime: Date;
}

export enum GatewayStatus {
  PENDING = 'Pending',
  READY = 'Ready',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}

export interface HTTPRoute {
  id: string;
  name: string;
  namespace: string;
  status: RouteStatus;
  parentRefs: ParentRef[];
  hostnames?: string[];
  rules: HTTPRouteRule[];
  createdAt: Date;
  updatedAt: Date;
  conditions?: RouteCondition[];
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
  backendRefs?: BackendRef[];
  timeouts?: HTTPRouteTimeouts;
}

export interface HTTPRouteMatch {
  path?: {
    type: 'Exact' | 'PathPrefix' | 'RegularExpression';
    value: string;
  };
  headers?: HTTPHeaderMatch[];
  queryParams?: HTTPQueryParamMatch[];
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
}

export interface HTTPHeaderMatch {
  type?: 'Exact' | 'RegularExpression';
  name: string;
  value: string;
}

export interface HTTPQueryParamMatch {
  type?: 'Exact' | 'RegularExpression';
  name: string;
  value: string;
}

export interface HTTPRouteFilter {
  type: 'RequestHeaderModifier' | 'ResponseHeaderModifier' | 'RequestMirror' | 'RequestRedirect' | 'URLRewrite' | 'ExtensionRef';
  requestHeaderModifier?: HTTPHeaderFilter;
  responseHeaderModifier?: HTTPHeaderFilter;
  requestMirror?: RequestMirrorFilter;
  requestRedirect?: HTTPRequestRedirectFilter;
  urlRewrite?: HTTPURLRewriteFilter;
  extensionRef?: LocalObjectReference;
}

export interface HTTPHeaderFilter {
  set?: HTTPHeader[];
  add?: HTTPHeader[];
  remove?: string[];
}

export interface HTTPHeader {
  name: string;
  value: string;
}

export interface RequestMirrorFilter {
  backendRef: BackendObjectReference;
}

export interface HTTPRequestRedirectFilter {
  scheme?: string;
  hostname?: string;
  path?: HTTPPathModifier;
  port?: number;
  statusCode?: number;
}

export interface HTTPURLRewriteFilter {
  hostname?: string;
  path?: HTTPPathModifier;
}

export interface HTTPPathModifier {
  type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
  replaceFullPath?: string;
  replacePrefixMatch?: string;
}

export interface HTTPRouteTimeouts {
  request?: string;
  backendRequest?: string;
}

export interface BackendRef extends BackendObjectReference {
  weight?: number;
  filters?: HTTPRouteFilter[];
}

export interface BackendObjectReference extends LocalObjectReference {
  group?: string;
  kind?: string;
  namespace?: string;
  port?: number;
}

export interface LocalObjectReference {
  name: string;
}

export interface RouteCondition {
  type: 'Accepted' | 'ResolvedRefs' | 'PartiallyInvalid';
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransitionTime: Date;
}

export enum RouteStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// Configuration types
export interface EnvoyGatewayConfig {
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  telemetry: {
    metrics: {
      prometheus: {
        disable: boolean;
      };
    };
    tracing?: {
      providers: TracingProvider[];
    };
  };
  provider: {
    type: 'Kubernetes';
    kubernetes?: {
      leaderElection?: any;
    };
  };
}

export interface TracingProvider {
  name: string;
  type: 'opentelemetry' | 'jaeger' | 'zipkin';
  config?: Record<string, any>;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface GatewayEvent extends WebSocketMessage {
  type: 'GATEWAY_CREATED' | 'GATEWAY_UPDATED' | 'GATEWAY_DELETED' | 'GATEWAY_STATUS_CHANGED';
  data: {
    gateway: Gateway;
    previousStatus?: GatewayStatus;
  };
}

export interface RouteEvent extends WebSocketMessage {
  type: 'ROUTE_CREATED' | 'ROUTE_UPDATED' | 'ROUTE_DELETED' | 'ROUTE_STATUS_CHANGED';
  data: {
    route: HTTPRoute;
    gatewayId: string;
  };
}

// Error types
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export class ValidationError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class KubernetesError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, 'KUBERNETES_ERROR', 500, details);
    this.name = 'KubernetesError';
  }
}

export class DockerError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, 'DOCKER_ERROR', 500, details);
    this.name = 'DockerError';
  }
}
