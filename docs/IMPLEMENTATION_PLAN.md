# Envoy Gateway Docker Desktop Extension - Implementation Plan

## Overview

This implementation plan transforms the current demo extension into a production-ready Envoy Gateway management tool following Docker Desktop extension best practices and official SDK patterns. The plan includes a dedicated focus on quick setup for learning and local development.

## Architecture Design (UPDATED)

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Desktop Extension                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Material-UI)                   │
│  ├── Docker Desktop Theme Integration                          │
│  ├── Extension API Client (@docker/extension-api-client)       │
│  ├── Gateway Management                                        │
│  ├── Route Configuration                                       │
│  ├── Quick Setup Wizard (NEW)                                  │
│  └── Monitoring & Alerts                                       │
├─────────────────────────────────────────────────────────────────┤
│  Backend Service (Node.js + TypeScript on Unix Socket)         │
│  ├── Socket Communication Handler                              │
│  ├── Kubernetes API Client + kubectl Binary                    │
│  ├── Envoy Gateway Controllers                                 │
│  ├── Quick Setup Service (NEW)                                 │
│  └── Configuration Manager                                     │
├─────────────────────────────────────────────────────────────────┤
│  Docker Desktop Extension Framework                            │
│  ├── Extension Host API                                        │
│  ├── VM Service Management                                     │
│  ├── Socket Communication                                      │
│  └── kubectl Binary Distribution                               │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                             │
│  ├── Envoy Gateway Controller (Auto-installed)                 │
│  ├── Gateway Resources (Quick Templates)                       │
│  ├── HTTPRoute Resources (Example Routes)                      │
│  └── ConfigMaps & Secrets                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack (UPDATED)

#### Frontend
- **Framework**: React 18 + TypeScript (as required by Docker Desktop)
- **State Management**: Redux Toolkit + RTK Query
- **UI Library**: Material-UI v5 with @docker/docker-mui-theme
- **Docker Integration**: @docker/extension-api-client
- **Build Tool**: Create-React-App (following official samples)
- **Testing**: Jest + React Testing Library

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Communication**: Unix Socket (Docker Desktop requirement)
- **Kubernetes Client**: @kubernetes/client-node + kubectl binary
- **Validation**: Joi/Zod
- **Testing**: Jest + Supertest

#### Infrastructure
- **Container**: Multi-stage Docker build (following official patterns)
- **Development**: Docker extension development workflow
- **CI/CD**: GitHub Actions
- **Documentation**: TypeDoc + Markdown

## Phase 1: Docker Desktop Extension Foundation (4 weeks)

### Week 1: Docker Desktop Extension Setup (REVISED)

#### Tasks (Days 1-3): Docker Desktop Compliance
1. **Update Dockerfile to Official Pattern**
   ```dockerfile
   # Multi-stage build following kubernetes-sample-extension
   FROM --platform=$BUILDPLATFORM node:18.9-alpine3.15 AS client-builder
   WORKDIR /ui
   COPY ui/package.json ui/package-lock.json ./
   RUN npm ci
   COPY ui ./
   RUN npm run build

   FROM --platform=$BUILDPLATFORM node:18-alpine AS server-builder
   WORKDIR /backend
   COPY backend/package*.json ./
   RUN npm ci
   COPY backend ./
   RUN npm run build

   FROM alpine
   LABEL org.opencontainers.image.title="Envoy Gateway" \
         org.opencontainers.image.description="Docker Desktop extension for managing Envoy Gateway resources" \
         com.docker.desktop.extension.api.version=">= 0.3.3" \
         com.docker.desktop.extension.icon="data:image/svg+xml..." \
         com.docker.extension.categories="networking,kubernetes,gateway"

   COPY --from=client-builder /ui/build /ui
   COPY --from=server-builder /backend/dist /backend
   COPY metadata.json icon.svg ./
   COPY binaries/ /
   COPY templates/ /templates
   CMD ["/backend/index.js"]
   ```

2. **Update metadata.json for VM Backend**
   ```json
   {
     "icon": "icon.svg",
     "ui": {
       "dashboard-tab": {
         "title": "Envoy Gateway",
         "root": "/ui",
         "src": "index.html"
       }
     },
     "vm": {
       "image": "${DESKTOP_PLUGIN_IMAGE}"
     },
     "host": {
       "binaries": [
         {
           "darwin": [{"path": "/darwin/kubectl"}],
           "windows": [{"path": "/windows/kubectl.exe"}],  
           "linux": [{"path": "/linux/kubectl"}]
         }
       ]
     }
   }
   ```

3. **Backend Socket Communication Setup**
   ```typescript
   // backend/src/socket-handler.ts
   import express from 'express';
   import http from 'http';
   import path from 'path';

   export class SocketBackend {
     private app: express.Application;
     private server: http.Server;
     private socketPath: string;

     constructor() {
       this.app = express();
       this.socketPath = process.env.SOCKET_PATH || '/tmp/backend.sock';
       this.setupRoutes();
       this.server = http.createServer(this.app);
     }

     setupRoutes() {
       this.app.use(express.json());
       
       // Docker Desktop extension routes
       this.app.get('/api/health', this.healthCheck);
       this.app.get('/api/namespaces', this.getNamespaces);
       this.app.get('/api/gateways', this.getGateways);
       
       // Quick setup routes
       this.app.post('/api/quick-setup/install', this.installEnvoyGateway);
       this.app.post('/api/quick-setup/validate', this.validateSetup);
       this.app.get('/api/quick-setup/templates', this.getTemplates);
     }

     start() {
       // Remove existing socket
       if (require('fs').existsSync(this.socketPath)) {
         require('fs').unlinkSync(this.socketPath);
       }
       
       this.server.listen(this.socketPath, () => {
         console.log(`Backend listening on socket: ${this.socketPath}`);
       });
     }
   }
   ```

#### Tasks (Days 4-5): Frontend Docker Desktop Integration
1. **React App with Docker Desktop Client**
   ```typescript
   // ui/src/App.tsx
   import React from 'react';
   import { createDockerDesktopClient } from '@docker/extension-api-client';
   import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';

   const ddClient = createDockerDesktopClient();

   export function App() {
     return (
       <DockerMuiThemeProvider>
         <EnvoyGatewayExtension ddClient={ddClient} />
       </DockerMuiThemeProvider>
     );
   }
   ```

2. **Frontend Package.json with Docker Dependencies**
   ```json
   {
     "dependencies": {
       "@docker/docker-mui-theme": "<0.1.0",
       "@docker/extension-api-client": "^0.3.0",
       "@emotion/react": "^11.9.0",
       "@emotion/styled": "^11.8.1",
       "@mui/icons-material": "^5.10.9",
       "@mui/material": "^5.6.1",
       "react": "^17.0.2",
       "typescript": "^4.8.3"
     },
     "devDependencies": {
       "@docker/extension-api-client-types": "^0.3.0"
     }
   }
   ```

#### Tasks (Days 6-7): Extension Installation & Testing
1. **Extension Build & Installation**
   ```bash
   # Build extension
   docker build --tag=envoy-gateway-extension:latest .
   
   # Install in Docker Desktop
   docker extension install envoy-gateway-extension:latest
   
   # Test extension
   docker extension ls
   ```

#### Deliverables
- [ ] Multi-stage Dockerfile following official patterns
- [ ] Socket-based backend communication
- [ ] React frontend with Docker Desktop theme
- [ ] Extension installable and running in Docker Desktop
- [ ] kubectl binaries included in extension

### Week 2: Enhanced Backend Architecture & Kubernetes Integration

#### Tasks
1. **Hybrid Kubernetes Integration with Quick Setup**
   ```typescript
   // services/kubernetes-manager.service.ts
   export class KubernetesManager {
     private k8sClient: k8s.CoreV1Api | null = null;
     private ddClient: any;

     constructor(ddClient: any) {
       this.ddClient = ddClient;
     }

     // Use kubectl binary shipped with extension
     async execKubectl(args: string[]): Promise<any> {
       return await this.ddClient.extension.host?.cli.exec('kubectl', args);
     }

     // Check if Docker Desktop Kubernetes is available
     async isDockerDesktopKubernetesAvailable(): Promise<boolean> {
       try {
         const result = await this.execKubectl(['cluster-info']);
         return !result.stderr && result.stdout.includes('Kubernetes control plane');
       } catch (error) {
         return false;
       }
     }

     // Enable Docker Desktop Kubernetes if not already enabled
     async enableDockerDesktopKubernetes(): Promise<boolean> {
       try {
         // Check current status
         const isAvailable = await this.isDockerDesktopKubernetesAvailable();
         if (isAvailable) return true;

         // Guide user to enable Kubernetes in Docker Desktop
         await this.ddClient.desktopUI.toast.warning(
           'Please enable Kubernetes in Docker Desktop Settings -> Kubernetes -> Enable Kubernetes'
         );
         return false;
       } catch (error) {
         console.error('Error checking Docker Desktop Kubernetes:', error);
         return false;
       }
     }

     // Use @kubernetes/client-node for programmatic access
     async getKubernetesClient(): Promise<k8s.CoreV1Api | null> {
       try {
         const kc = new k8s.KubeConfig();
         kc.loadFromDefault();
         this.k8sClient = kc.makeApiClient(k8s.CoreV1Api);
         return this.k8sClient;
       } catch (error) {
         console.error('Failed to create k8s client:', error);
         return null;
       }
     }

     // Fallback to demo data
     getDemoData(): MockData {
       return {
         namespaces: mockNamespaces,
         gateways: mockGateways,
         routes: mockRoutes
       };
     }

     // Strategy pattern for data access
     async getNamespaces(): Promise<Namespace[]> {
       try {
         // Try kubectl first
         const result = await this.execKubectl(['get', 'namespaces', '-o', 'json']);
         if (result && !result.stderr) {
           return JSON.parse(result.stdout).items;
         }

         // Try k8s client
         const client = await this.getKubernetesClient();
         if (client) {
           const response = await client.listNamespace();
           return response.body.items;
         }

         // Fallback to demo
         return this.getDemoData().namespaces;
       } catch (error) {
         console.error('Error getting namespaces:', error);
         return this.getDemoData().namespaces;
       }
     }
   }
   ```

2. **Quick Setup Service Implementation**
   ```typescript
   // services/quick-setup.service.ts
   export class QuickSetupService {
     constructor(
       private kubernetesManager: KubernetesManager,
       private ddClient: any
     ) {}

     async checkPrerequisites(): Promise<SetupStatus> {
       const checks = {
         dockerDesktopRunning: true, // Always true if extension is running
         kubernetesEnabled: await this.kubernetesManager.isDockerDesktopKubernetesAvailable(),
         envoyGatewayInstalled: await this.checkEnvoyGatewayInstalled(),
         namespaceReady: false
       };

       return {
         ready: Object.values(checks).every(Boolean),
         checks
       };
     }

     async installEnvoyGateway(): Promise<InstallResult> {
       try {
         // Check if Kubernetes is available
         if (!await this.kubernetesManager.isDockerDesktopKubernetesAvailable()) {
           await this.kubernetesManager.enableDockerDesktopKubernetes();
           return { 
             success: false, 
             error: 'Please enable Kubernetes in Docker Desktop first' 
           };
         }

         // Install Envoy Gateway using kubectl
         const installCommands = [
           ['apply', '-f', 'https://github.com/envoyproxy/gateway/releases/download/latest/install.yaml'],
           ['wait', '--timeout=300s', '--for=condition=available', 'deployment', '-n', 'envoy-gateway-system', '--all']
         ];

         for (const cmd of installCommands) {
           const result = await this.kubernetesManager.execKubectl(cmd);
           if (result.stderr && !result.stderr.includes('Warning')) {
             throw new Error(result.stderr);
           }
         }

         return { success: true };
       } catch (error) {
         return { 
           success: false, 
           error: error.message 
         };
       }
     }

     async createExampleConfiguration(): Promise<ConfigResult> {
       try {
         // Create a simple example gateway and route
         const exampleConfig = `
   apiVersion: gateway.networking.k8s.io/v1
   kind: Gateway
   metadata:
     name: example-gateway
     namespace: default
   spec:
     gatewayClassName: envoy-gateway
     listeners:
     - name: http
       port: 80
       protocol: HTTP
   ---
   apiVersion: gateway.networking.k8s.io/v1
   kind: HTTPRoute
   metadata:
     name: example-route
     namespace: default
   spec:
     parentRefs:
     - name: example-gateway
     hostnames:
     - "example.local"
     rules:
     - matches:
       - path:
           type: PathPrefix
           value: /
       backendRefs:
       - name: example-service
         port: 80
         `;

         const result = await this.kubernetesManager.execKubectl([
           'apply', '-f', '-'
         ], exampleConfig);

         if (result.stderr && !result.stderr.includes('Warning')) {
           throw new Error(result.stderr);
         }

         return { success: true };
       } catch (error) {
         return { 
           success: false, 
           error: error.message 
         };
       }
     }

     private async checkEnvoyGatewayInstalled(): Promise<boolean> {
       try {
         const result = await this.kubernetesManager.execKubectl([
           'get', 'deployment', '-n', 'envoy-gateway-system', 'envoy-gateway'
         ]);
         return !result.stderr;
       } catch (error) {
         return false;
       }
     }
   }
   ```

#### Deliverables
- [ ] Hybrid Kubernetes integration (kubectl + client library + demo)
- [ ] Socket-based API endpoints functional
- [ ] Docker Desktop extension backend service running
- [ ] Error handling and fallback to demo mode
- [ ] Quick setup service implementation

### Week 3: React Frontend with Docker Desktop Integration

#### Tasks
1. **Docker Desktop API Integration**
   ```typescript
   // hooks/useDockerDesktop.ts
   import { createDockerDesktopClient } from '@docker/extension-api-client';

   export const useDockerDesktop = () => {
     const [ddClient] = useState(() => createDockerDesktopClient());

     const callBackend = async (endpoint: string, method = 'GET', data?: any) => {
       try {
         switch (method) {
           case 'GET':
             return await ddClient.extension.vm?.service?.get(endpoint);
           case 'POST':
             return await ddClient.extension.vm?.service?.post(endpoint, data);
           default:
             throw new Error(`Unsupported method: ${method}`);
         }
       } catch (error) {
         console.error('Backend call failed:', error);
         throw error;
       }
     };

     return { ddClient, callBackend };
   };
   ```

2. **Redux Store with Docker Desktop Integration**
   ```typescript
   // store/api.ts
   import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   import { createDockerDesktopClient } from '@docker/extension-api-client';

   const ddClient = createDockerDesktopClient();

   const dockerDesktopBaseQuery = fetchBaseQuery({
     baseUrl: '/',
     fetchFn: async (input, init) => {
       // Use Docker Desktop extension VM service
       const endpoint = typeof input === 'string' ? input : input.url;
       const result = await ddClient.extension.vm?.service?.get(endpoint);
       
       return new Response(JSON.stringify(result), {
         headers: { 'Content-Type': 'application/json' }
       });
     }
   });

   export const api = createApi({
     reducerPath: 'api',
     baseQuery: dockerDesktopBaseQuery,
     tagTypes: ['Namespace', 'Gateway', 'Route', 'QuickSetup'],
     endpoints: (builder) => ({
       getNamespaces: builder.query<Namespace[], void>({
         query: () => '/api/namespaces',
         providesTags: ['Namespace']
       }),
       getGateways: builder.query<Gateway[], string | undefined>({
         query: (namespace) => `/api/gateways${namespace ? `?namespace=${namespace}` : ''}`,
         providesTags: ['Gateway']
       }),
       // Quick setup endpoints
       checkSetupStatus: builder.query<SetupStatus, void>({
         query: () => '/api/quick-setup/status',
         providesTags: ['QuickSetup']
       }),
       installEnvoyGateway: builder.mutation<InstallResult, void>({
         query: () => ({
           url: '/api/quick-setup/install',
           method: 'POST'
         }),
         invalidatesTags: ['QuickSetup']
       }),
       createExampleConfig: builder.mutation<ConfigResult, void>({
         query: () => ({
           url: '/api/quick-setup/example',
           method: 'POST'
         }),
         invalidatesTags: ['Gateway', 'Route']
       })
     })
   });
   ```

3. **Material-UI with Docker Theme**
   ```typescript
   // components/layout/AppLayout.tsx
   import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
   import { AppBar, Toolbar, Typography, Container } from '@mui/material';

   export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     return (
       <DockerMuiThemeProvider>
         <AppBar position="static">
           <Toolbar>
             <Typography variant="h6">
               Envoy Gateway
             </Typography>
           </Toolbar>
         </AppBar>
         <Container maxWidth="lg" sx={{ mt: 2 }}>
           {children}
         </Container>
       </DockerMuiThemeProvider>
     );
   };
   ```

#### Deliverables
- [ ] React application using Docker Desktop theme
- [ ] Redux RTK Query with Docker Desktop backend integration
- [ ] Material-UI components following Docker Desktop patterns
- [ ] Namespace selector working with real Docker Desktop communication

### Week 4: Feature Preservation & Enhanced UI + Quick Setup UI

#### Tasks
1. **Preserve Existing Namespace Selector Functionality**
   ```typescript
   // components/NamespaceSelector.tsx
   import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
   import { useGetNamespacesQuery } from '../store/api';

   export const NamespaceSelector: React.FC = () => {
     const { data: namespaces, isLoading } = useGetNamespacesQuery();
     const [selectedNamespace, setSelectedNamespace] = useState('');

     return (
       <FormControl fullWidth sx={{ mb: 2 }}>
         <InputLabel>Namespace</InputLabel>
         <Select
           value={selectedNamespace}
           label="Namespace"
           onChange={(e) => setSelectedNamespace(e.target.value)}
         >
           <MenuItem value="">All Namespaces</MenuItem>
           {namespaces?.map((ns) => (
             <MenuItem key={ns.name} value={ns.name}>
               {ns.name}
             </MenuItem>
           ))}
         </Select>
       </FormControl>
     );
   };
   ```

2. **Enhanced Resource Lists with Docker Desktop Styling**
   ```typescript
   // components/GatewayList.tsx
   import { 
     Paper, 
     Table, 
     TableBody, 
     TableCell, 
     TableContainer, 
     TableHead, 
     TableRow,
     Chip
   } from '@mui/material';

   export const GatewayList: React.FC = () => {
     const selectedNamespace = useAppSelector(state => state.namespaces.selected);
     const { data: gateways, isLoading } = useGetGatewaysQuery(selectedNamespace);

     return (
       <TableContainer component={Paper}>
         <Table>
           <TableHead>
             <TableRow>
               <TableCell>Name</TableCell>
               <TableCell>Namespace</TableCell>
               <TableCell>Status</TableCell>
               <TableCell>Listeners</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {gateways?.map((gateway) => (
               <TableRow key={`${gateway.namespace}-${gateway.name}`}>
                 <TableCell>{gateway.name}</TableCell>
                 <TableCell>
                   <Chip label={gateway.namespace} size="small" variant="outlined" />
                 </TableCell>
                 <TableCell>
                   <Chip 
                     label={gateway.status} 
                     color={gateway.status === 'Ready' ? 'success' : 'warning'}
                     size="small"
                   />
                 </TableCell>
                 <TableCell>{gateway.listeners?.length || 0}</TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </TableContainer>
     );
   };
   ```

3. **Quick Setup Wizard Component (NEW)**
   ```typescript
   // components/QuickSetup/QuickSetupWizard.tsx
   import React, { useState } from 'react';
   import {
     Dialog,
     DialogTitle,
     DialogContent,
     DialogActions,
     Stepper,
     Step,
     StepLabel,
     Button,
     Typography,
     Box,
     CircularProgress,
     Alert
   } from '@mui/material';
   import { useCheckSetupStatusQuery, useInstallEnvoyGatewayMutation } from '../../store/api';

   export const QuickSetupWizard: React.FC = () => {
     const [open, setOpen] = useState(false);
     const [activeStep, setActiveStep] = useState(0);
     const { data: setupStatus, refetch } = useCheckSetupStatusQuery();
     const [installEnvoyGateway, { isLoading, error }] = useInstallEnvoyGatewayMutation();

     const steps = [
       'Prerequisites Check',
       'Install Envoy Gateway',
       'Create Example Configuration',
       'Setup Complete'
     ];

     const handleInstall = async () => {
       try {
         await installEnvoyGateway().unwrap();
         setActiveStep(1);
         refetch();
       } catch (error) {
         console.error('Installation failed:', error);
       }
     };

     return (
       <>
         <Button
           variant="contained"
           color="primary"
           onClick={() => setOpen(true)}
           size="large"
         >
           🚀 Quick Setup for Learning
         </Button>

         <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
           <DialogTitle>Envoy Gateway Quick Setup</DialogTitle>
           <DialogContent>
             <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
               {steps.map((label) => (
                 <Step key={label}>
                   <StepLabel>{label}</StepLabel>
                 </Step>
               ))}
             </Stepper>

             {activeStep === 0 && (
               <Box>
                 <Typography variant="h6" gutterBottom>
                   Prerequisites Check
                 </Typography>
                 <SetupStatusChecks status={setupStatus} />
               </Box>
             )}

             {activeStep === 1 && (
               <Box>
                 <Typography variant="h6" gutterBottom>
                   Installing Envoy Gateway
                 </Typography>
                 {isLoading ? (
                   <Box display="flex" alignItems="center" gap={2}>
                     <CircularProgress />
                     <Typography>Installing Envoy Gateway...</Typography>
                   </Box>
                 ) : (
                   <Button onClick={handleInstall} variant="contained">
                     Install Now
                   </Button>
                 )}
                 {error && (
                   <Alert severity="error" sx={{ mt: 2 }}>
                     Installation failed: {error.message}
                   </Alert>
                 )}
               </Box>
             )}

             {/* Additional steps... */}
           </DialogContent>
           <DialogActions>
             <Button onClick={() => setOpen(false)}>Close</Button>
           </DialogActions>
         </Dialog>
       </>
     );
   };
   ```

#### Deliverables
- [ ] All existing functionality preserved
- [ ] Enhanced UI with Docker Desktop Material-UI theme
- [ ] Real-time data integration working
- [ ] Namespace selector with live data
- [ ] Quick Setup Wizard component implemented

## Phase 2: Core Features Implementation (8 weeks)

### Week 5-6: Real-time Updates & Kubernetes Watch + Quick Setup Backend

#### Tasks
1. **Kubernetes Watch Implementation**
   ```typescript
   // services/kubernetes-watch.service.ts
   export class KubernetesWatchService {
     private watchers: Map<string, any> = new Map();

     async watchNamespaces(callback: (namespaces: any[]) => void) {
       try {
         // Use kubectl watch
         const watch = await this.ddClient.extension.host?.cli.exec('kubectl', [
           'get', 'namespaces', '--watch', '-o', 'json'
         ]);
         
         // Parse watch events and call callback
         this.parseWatchEvents(watch, callback);
       } catch (error) {
         console.error('Watch failed:', error);
         // Fallback to polling
         this.pollResource('namespaces', callback);
       }
     }

     async watchGateways(namespace: string, callback: (gateways: any[]) => void) {
       const args = ['get', 'gateways', '--watch', '-o', 'json'];
       if (namespace) args.push('-n', namespace);
       
       try {
         const watch = await this.ddClient.extension.host?.cli.exec('kubectl', args);
         this.parseWatchEvents(watch, callback);
       } catch (error) {
         console.error('Gateway watch failed:', error);
         this.pollResource(`gateways-${namespace}`, callback);
       }
     }
   }
   ```

2. **Real-time Redux Integration**
   ```typescript
   // store/realtime-middleware.ts
   export const realtimeMiddleware: Middleware = (store) => (next) => (action) => {
     if (action.type.endsWith('/watch')) {
       const { resource, namespace } = action.payload;
       
       // Set up real-time watch
       watchService.watch(resource, namespace, (data) => {
         store.dispatch(api.util.updateQueryData(
           `get${resource}`,
           namespace,
           () => data
         ));
       });
     }
     
     return next(action);
   };
   ```

3. **Complete Quick Setup Backend Implementation**
   ```typescript
   // backend/src/controllers/quick-setup.controller.ts
   export class QuickSetupController {
     constructor(
       private quickSetupService: QuickSetupService,
       private templateService: TemplateService
     ) {}

     async checkStatus(req: Request, res: Response) {
       try {
         const status = await this.quickSetupService.checkPrerequisites();
         res.json(status);
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     }

     async installEnvoyGateway(req: Request, res: Response) {
       try {
         const result = await this.quickSetupService.installEnvoyGateway();
         res.json(result);
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     }

     async createExampleConfig(req: Request, res: Response) {
       try {
         const result = await this.quickSetupService.createExampleConfiguration();
         res.json(result);
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     }

     async getTemplates(req: Request, res: Response) {
       try {
         const templates = await this.templateService.getAvailableTemplates();
         res.json({ templates });
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     }

     async applyTemplate(req: Request, res: Response) {
       const { templateName, namespace = 'default' } = req.body;
       try {
         const result = await this.templateService.applyTemplate(templateName, namespace);
         res.json(result);
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     }
   }
   ```

#### Deliverables
- [ ] Real-time Kubernetes watch implementation
- [ ] Live namespace updates
- [ ] Real-time gateway status monitoring
- [ ] Polling fallback for watch failures
- [ ] Complete quick setup backend API

### Week 7-8: Gateway CRUD Operations + Learning Templates

#### Tasks
1. **Gateway Creation with Docker Desktop Integration**
   ```typescript
   // components/GatewayCreateDialog.tsx
   export const GatewayCreateDialog: React.FC = () => {
     const { ddClient } = useDockerDesktop();
     const [createGateway] = useCreateGatewayMutation();

     const handleCreate = async (gateway: Gateway) => {
       try {
         // Validate configuration first
         const validation = await ddClient.extension.vm?.service?.post(
           '/api/gateways/validate',
           gateway
         );

         if (validation.valid) {
           await createGateway(gateway);
           onClose();
         } else {
           setErrors(validation.errors);
         }
       } catch (error) {
         console.error('Gateway creation failed:', error);
       }
     };

     return (
       <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle>Create Gateway</DialogTitle>
         <DialogContent>
           <GatewayForm onSubmit={handleCreate} />
         </DialogContent>
       </Dialog>
     );
   };
   ```

2. **Backend Gateway Management**
   ```typescript
   // backend/src/controllers/gateway.controller.ts
   export class GatewayController {
     constructor(private kubernetesManager: KubernetesManager) {}

     async createGateway(req: Request, res: Response) {
       const gateway = req.body;
       try {
         // Validate gateway configuration
         const validation = await this.validateGateway(gateway);
         if (!validation.valid) {
           return res.status(400).json({ errors: validation.errors });
         }

         // Create via kubectl
         const yaml = this.gatewayToYaml(gateway);
         const result = await this.kubernetesManager.execKubectl([
           'apply', '-f', '-'
         ], yaml);

         if (result.stderr) {
           throw new Error(result.stderr);
         }

         res.json({ success: true, gateway });
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     }
   }
   ```

3. **Learning Templates Service**
   ```typescript
   // services/template.service.ts
   export class TemplateService {
     private templates: Map<string, Template> = new Map();

     constructor() {
       this.initializeTemplates();
     }

     private initializeTemplates() {
       this.templates.set('basic-gateway', {
         name: 'Basic Gateway',
         description: 'Simple HTTP gateway for learning',
         category: 'Learning',
         resources: [
           {
             apiVersion: 'gateway.networking.k8s.io/v1',
             kind: 'Gateway',
             metadata: { name: 'learning-gateway' },
             spec: {
               gatewayClassName: 'envoy-gateway',
               listeners: [{ name: 'http', port: 80, protocol: 'HTTP' }]
             }
           }
         ]
       });

       this.templates.set('microservices-demo', {
         name: 'Microservices Demo',
         description: 'Complete microservices setup with routing',
         category: 'Advanced',
         resources: [
           // Gateway + Multiple HTTPRoutes + Sample services
         ]
       });

       // Additional templates...
     }

     async getAvailableTemplates(): Promise<Template[]> {
       return Array.from(this.templates.values());
     }

     async applyTemplate(templateName: string, namespace: string): Promise<TemplateResult> {
       const template = this.templates.get(templateName);
       if (!template) {
         throw new Error(`Template ${templateName} not found`);
       }

       try {
         const results = [];
         for (const resource of template.resources) {
           resource.metadata.namespace = namespace;
           const yaml = this.resourceToYaml(resource);
           const result = await this.kubernetesManager.execKubectl([
             'apply', '-f', '-'
           ], yaml);
           results.push(result);
         }

         return { success: true, appliedResources: results.length };
       } catch (error) {
         return { success: false, error: error.message };
       }
     }
   }
   ```

#### Deliverables
- [ ] Gateway creation wizard with validation
- [ ] Full CRUD operations for gateways
- [ ] Real-time status updates
- [ ] Configuration validation
- [ ] Learning templates system

### Week 9-10: Route Management + Interactive Tutorials

#### Tasks
1. **Route Builder with Material-UI**
   ```typescript
   // components/RouteBuilder.tsx
   export const RouteBuilder: React.FC = () => {
     const [rules, setRules] = useState<RouteRule[]>([]);

     const addRule = () => {
       setRules([...rules, {
         matches: [{ path: { type: 'PathPrefix', value: '/' } }],
         backendRefs: []
       }]);
     };

     return (
       <Paper sx={{ p: 2 }}>
         <Typography variant="h6" gutterBottom>
           Route Rules
         </Typography>
         {rules.map((rule, index) => (
           <RuleEditor
             key={index}
             rule={rule}
             onChange={(updatedRule) => {
               const newRules = [...rules];
               newRules[index] = updatedRule;
               setRules(newRules);
             }}
           />
         ))}
         <Button onClick={addRule} variant="outlined" fullWidth>
           Add Rule
         </Button>
       </Paper>
     );
   };
   ```

2. **Interactive Tutorial System**
   ```typescript
   // components/Learning/InteractiveTutorial.tsx
   export const InteractiveTutorial: React.FC = () => {
     const [currentStep, setCurrentStep] = useState(0);
     const [tutorialOpen, setTutorialOpen] = useState(false);

     const tutorials = [
       {
         id: 'basic-gateway',
         title: 'Creating Your First Gateway',
         steps: [
           {
             title: 'Understanding Gateways',
             content: 'Learn what Envoy Gateway does...',
             action: 'highlight-gateway-section'
           },
           {
             title: 'Create a Gateway',
             content: 'Click the "Create Gateway" button...',
             action: 'open-gateway-dialog'
           },
           // More steps...
         ]
       }
     ];

     return (
       <TutorialProvider tutorials={tutorials}>
         <TutorialHighlight>
           <MainApplicationContent />
         </TutorialHighlight>
         <TutorialDialog
           open={tutorialOpen}
           onClose={() => setTutorialOpen(false)}
         />
       </TutorialProvider>
     );
   };
   ```

#### Deliverables
- [ ] Visual route builder
- [ ] HTTPRoute management
- [ ] Route validation system
- [ ] Backend service discovery
- [ ] Interactive tutorial system

### Week 11-12: Monitoring Dashboard + Learning Progress

#### Tasks
1. **Metrics Dashboard with Docker Desktop Theme**
   ```typescript
   // components/MonitoringDashboard.tsx
   export const MonitoringDashboard: React.FC = () => {
     const metrics = useRealtimeMetrics();

     return (
       <Grid container spacing={3}>
         <Grid item xs={12} md={6}>
           <MetricCard
             title="Gateway Health"
             value={`${metrics.healthyGateways}/${metrics.totalGateways}`}
             icon={<HealthIcon />}
             color="success"
           />
         </Grid>
         <Grid item xs={12} md={6}>
           <MetricCard
             title="Routes"
             value={metrics.totalRoutes}
             icon={<RouteIcon />}
             color="primary"
           />
         </Grid>
         <Grid item xs={12}>
           <LatencyChart data={metrics.latencyData} />
         </Grid>
       </Grid>
     );
   };
   ```

2. **Learning Progress Tracking**
   ```typescript
   // components/Learning/ProgressTracker.tsx
   export const LearningProgressTracker: React.FC = () => {
     const [progress, setProgress] = useState<LearningProgress>({
       completedTutorials: [],
       currentLevel: 'Beginner',
       achievements: [],
       setupComplete: false
     });

     return (
       <Card sx={{ mb: 2 }}>
         <CardContent>
           <Typography variant="h6" gutterBottom>
             Learning Progress
           </Typography>
           <LinearProgress 
             variant="determinate" 
             value={calculateProgressPercentage(progress)} 
             sx={{ mb: 2 }}
           />
           <Box display="flex" justifyContent="space-between">
             <Typography variant="body2">
               {progress.completedTutorials.length} tutorials completed
             </Typography>
             <Typography variant="body2">
               Level: {progress.currentLevel}
             </Typography>
           </Box>
         </CardContent>
       </Card>
     );
   };
   ```

#### Deliverables
- [ ] Real-time metrics dashboard
- [ ] Gateway health monitoring
- [ ] Performance charts
- [ ] Alert configuration
- [ ] Learning progress tracking

## Phase 3: Advanced Features & Polish (4 weeks)

### Week 13-14: Configuration Management + Learning Resources

#### Tasks
1. **YAML Export/Import with Docker Desktop Integration**
   ```typescript
   // services/config-manager.service.ts
   export class ConfigManager {
     constructor(private ddClient: any) {}

     async exportConfiguration(): Promise<string> {
       // Export all resources as YAML
       const resources = await this.getAllResources();
       return this.resourcesToYaml(resources);
     }

     async importConfiguration(yaml: string): Promise<void> {
       // Validate and apply YAML configuration
       const validation = await this.validateYaml(yaml);
       if (!validation.valid) {
         throw new Error(validation.errors.join(', '));
       }

       await this.ddClient.extension.vm?.service?.post('/api/config/import', {
         yaml
       });
     }
   }
   ```

2. **Integrated Learning Resources**
   ```typescript
   // components/Learning/ResourceCenter.tsx
   export const LearningResourceCenter: React.FC = () => {
     const resources = [
       {
         type: 'video',
         title: 'Envoy Gateway Fundamentals',
         url: '/tutorials/fundamentals',
         duration: '15 min'
       },
       {
         type: 'guide',
         title: 'Setting up TLS Termination',
         url: '/guides/tls-setup',
         difficulty: 'Intermediate'
       },
       {
         type: 'example',
         title: 'Microservices Gateway Pattern',
         template: 'microservices-demo',
         difficulty: 'Advanced'
       }
     ];

     return (
       <Grid container spacing={2}>
         {resources.map((resource, index) => (
           <Grid item xs={12} md={4} key={index}>
             <ResourceCard resource={resource} />
           </Grid>
         ))}
       </Grid>
     );
   };
   ```

#### Deliverables
- [ ] YAML export/import functionality
- [ ] Configuration templates
- [ ] Version control integration
- [ ] Integrated learning resources

### Week 15-16: Security & RBAC + Cleanup Tools

#### Tasks
1. **RBAC Integration**
   ```typescript
   // services/rbac.service.ts
   export class RBACService {
     async checkPermissions(resource: string, verb: string, namespace?: string): Promise<boolean> {
       try {
         const args = ['auth', 'can-i', verb, resource];
         if (namespace) args.push('-n', namespace);

         const result = await this.ddClient.extension.host?.cli.exec('kubectl', args);
         return result.stdout.trim() === 'yes';
       } catch (error) {
         console.error('Permission check failed:', error);
         return false;
       }
     }
   }
   ```

2. **Learning Environment Cleanup**
   ```typescript
   // services/cleanup.service.ts
   export class CleanupService {
     async cleanupLearningEnvironment(): Promise<CleanupResult> {
       try {
         // Remove all learning resources
         const cleanupCommands = [
           ['delete', 'gateway', '--all', '-n', 'default'],
           ['delete', 'httproute', '--all', '-n', 'default'],
           ['delete', 'namespace', 'envoy-gateway-learning']
         ];

         for (const cmd of cleanupCommands) {
           await this.kubernetesManager.execKubectl(cmd);
         }

         return { success: true, message: 'Learning environment cleaned up' };
       } catch (error) {
         return { success: false, error: error.message };
       }
     }

     async resetToCleanState(): Promise<CleanupResult> {
       // Reset everything to initial clean state
       await this.cleanupLearningEnvironment();
       await this.clearLocalProgress();
       return { success: true, message: 'Environment reset to clean state' };
     }
   }
   ```

#### Deliverables
- [ ] RBAC integration
- [ ] Permission-based UI
- [ ] Secure secret handling
- [ ] Audit logging
- [ ] Learning environment cleanup tools

## Quick Setup Features Implementation

### Quick Setup Components Added

1. **Prerequisites Checker**
   - Docker Desktop running (automatic)
   - Kubernetes enabled in Docker Desktop
   - Envoy Gateway installation status
   - Namespace readiness

2. **One-Click Installation**
   - Automated Envoy Gateway installation
   - Progress tracking and status updates
   - Error handling and user guidance

3. **Example Templates**
   - Basic Gateway (learning)
   - Microservices Demo (advanced)
   - TLS Termination Example
   - Load Balancing Example

4. **Interactive Tutorials**
   - Step-by-step guided setup
   - In-app help and documentation
   - Progress tracking
   - Achievement system

5. **Learning Environment Management**
   - Easy cleanup and reset
   - Isolated learning namespace
   - Safe experimentation environment

## Docker Desktop Extension Best Practices Implementation

### 1. Multi-Stage Dockerfile
- ✅ Frontend build stage with Node.js
- ✅ Backend build stage with TypeScript compilation
- ✅ Final Alpine stage with proper labels
- ✅ Platform-specific kubectl binaries
- ✅ Template files included

### 2. Socket Communication
- ✅ Backend listens on Unix socket
- ✅ Express.js routing for extension APIs
- ✅ Proper error handling and logging
- ✅ Quick setup API endpoints

### 3. Frontend Integration
- ✅ Docker Desktop extension API client
- ✅ Material-UI with Docker theme
- ✅ Proper component architecture
- ✅ Docker Desktop UI patterns
- ✅ Quick setup wizard UI

### 4. Kubernetes Integration
- ✅ kubectl binary inclusion
- ✅ @kubernetes/client-node fallback
- ✅ Demo mode for offline usage
- ✅ Proper error handling
- ✅ Docker Desktop Kubernetes integration

### 5. Extension Lifecycle
- ✅ Proper metadata.json configuration
- ✅ Extension installation workflow
- ✅ Docker Desktop integration testing
- ✅ Quick setup onboarding flow

## Success Criteria

### Phase 1 Success Criteria
- [ ] Extension follows Docker Desktop best practices 100%
- [ ] Socket communication working properly
- [ ] React frontend with Docker Desktop theme
- [ ] kubectl binary integration functional
- [ ] Quick setup wizard accessible

### Phase 2 Success Criteria
- [ ] Real-time updates via Docker Desktop API
- [ ] Full CRUD operations for all resources
- [ ] Namespace selector working with live data
- [ ] Monitoring dashboard functional
- [ ] Quick setup installation working
- [ ] Learning templates available

### Phase 3 Success Criteria
- [ ] All advanced features implemented
- [ ] RBAC integration complete
- [ ] Extension ready for Docker Desktop Marketplace
- [ ] Interactive tutorials functional
- [ ] Learning environment cleanup tools working

## Conclusion

This updated implementation plan ensures 100% compliance with Docker Desktop extension best practices while delivering all the features outlined in the PRD, including the new Quick Setup epic for learning and local development. The addition of interactive tutorials, learning templates, and automated setup significantly improves the onboarding experience for new users.

**Next Steps**:
1. Begin Phase 1 with Docker Desktop extension compliance
2. Set up development environment following official patterns
3. Implement socket-based backend communication
4. Migrate frontend to React with Docker Desktop theme
5. Develop quick setup wizard and learning features
