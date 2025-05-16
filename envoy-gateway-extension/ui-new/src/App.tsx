import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { createDockerDesktopClient } from '@docker/extension-api-client';

// Import our enhanced components
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  NotificationProvider, 
  useNotificationHelpers 
} from './components/NotificationSystem';
import { 
  ApiClient, 
  ApiError, 
  NetworkError 
} from './services/apiClient';

interface AppProps {
  ddClient: ReturnType<typeof createDockerDesktopClient>;
}

interface Namespace {
  name: string;
  status: string;
  createdAt: Date | string;
}

interface Gateway {
  name: string;
  namespace: string;
  status: string;
  gatewayClassName: string;
  listeners?: Array<{
    name: string;
    port: number;
    protocol: string;
  }>;
  createdAt: Date | string;
}

interface Route {
  name: string;
  namespace: string;
  status: string;
  hostnames?: string[];
  rules?: Array<{
    path: string;
  }>;
  createdAt: Date | string;
}

interface BackendStatus {
  status: string;
  mode: string;
  timestamp: string;
  kubernetes: boolean;
  connection: string;
  error?: string;
}

function AppContent({ ddClient }: AppProps) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiClient] = useState(() => new ApiClient(ddClient));

  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showApiError,
    showDemoModeWarning,
    showKubernetesDisconnected
  } = useNotificationHelpers();

  useEffect(() => {
    console.log('Envoy Gateway Extension started with ddClient:', ddClient);
    checkBackendConnection();
    loadData();
  }, [ddClient]);

  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connection...');
      const result = await apiClient.getHealth();
      console.log('Backend health check result:', result);
      
      setBackendStatus(result);
      setError(null);
      
      if (!result.kubernetes) {
        showDemoModeWarning();
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      
      if (error instanceof NetworkError) {
        setError('Backend connection failed. Please check if the extension is running.');
        showError(
          'Backend service is not responding. Please restart the extension.',
          'Connection Failed'
        );
      } else if (error instanceof ApiError) {
        setError(`Backend error: ${error.message}`);
        showApiError(error, 'Backend Error');
      } else {
        setError('Unknown backend error occurred.');
        showError('An unexpected error occurred while connecting to the backend.');
      }
      
      // Set fallback status for demo mode
      setBackendStatus({
        status: 'error',
        mode: 'demo',
        timestamp: new Date().toISOString(),
        kubernetes: false,
        connection: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading namespaces...');
      const namespacesData = await apiClient.getNamespaces();
      console.log('Namespaces result:', namespacesData);
      
      setNamespaces(namespacesData.namespaces);
      showSuccess(`Loaded ${namespacesData.namespaces.length} namespaces`);

      await loadGateways(selectedNamespace);
      await loadRoutes(selectedNamespace);
    } catch (error) {
      console.error('Data loading failed:', error);
      showApiError(error, 'Failed to Load Data');
      
      // Fallback to empty arrays
      setNamespaces([]);
      setGateways([]);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGateways = async (namespace?: string) => {
    setLoadingGateways(true);
    try {
      console.log('Loading gateways for namespace:', namespace);
      const gatewaysData = await apiClient.getGateways(namespace);
      console.log('Gateways result:', gatewaysData);
      
      setGateways(gatewaysData.gateways);
    } catch (error) {
      console.error('Gateway loading failed:', error);
      showApiError(error, 'Failed to Load Gateways');
      setGateways([]);
    } finally {
      setLoadingGateways(false);
    }
  };

  const loadRoutes = async (namespace?: string) => {
    setLoadingRoutes(true);
    try {
      console.log('Loading routes for namespace:', namespace);
      const routesData = await apiClient.getRoutes(namespace);
      console.log('Routes result:', routesData);
      
      setRoutes(routesData.routes);
    } catch (error) {
      console.error('Route loading failed:', error);
      showApiError(error, 'Failed to Load Routes');
      setRoutes([]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleNamespaceChange = (event: SelectChangeEvent) => {
    const namespace = event.target.value;
    setSelectedNamespace(namespace);
    console.log('Namespace changed to:', namespace);
    loadGateways(namespace);
    loadRoutes(namespace);
  };

  const refreshData = async () => {
    console.log('Refreshing data...');
    showWarning('Refreshing data...', 'Refresh', { duration: 1000 });
    await loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
      case 'accepted':
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'error';
    }
  };

  const SkeletonTable = ({ rows = 3, cols = 5 }) => (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: cols }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton variant="text" width="80%" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Envoy Gateway
          </Typography>
          <Chip 
            label={backendStatus?.mode === 'demo' ? 'Demo Mode' : 'Connected'}
            color={backendStatus?.status === 'healthy' ? 'success' : 'default'}
            variant="outlined"
            sx={{ ml: 2, color: 'white', borderColor: 'white' }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        {error && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={checkBackendConnection}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Status Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Backend Status</Typography>
                <Typography variant="h6">
                  {backendStatus?.status || 'Unknown'}
                  <Chip 
                    label={backendStatus?.mode || 'Unknown'} 
                    size="small" 
                    sx={{ ml: 1 }}
                    color={backendStatus?.status === 'healthy' ? 'success' : 'default'}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Kubernetes</Typography>
                <Typography variant="h6">
                  {backendStatus?.kubernetes ? 'Connected' : 'Demo Mode'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Gateways</Typography>
                <Typography variant="h6">
                  {loadingGateways ? <CircularProgress size={20} /> : gateways.length}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Routes</Typography>
                <Typography variant="h6">
                  {loadingRoutes ? <CircularProgress size={20} /> : routes.length}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Namespace Selector */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Namespace</InputLabel>
                <Select
                  value={selectedNamespace}
                  label="Namespace"
                  onChange={handleNamespaceChange}
                  disabled={loading}
                >
                  <MenuItem value="">All Namespaces</MenuItem>
                  {namespaces.map((ns) => (
                    <MenuItem key={ns.name} value={ns.name}>
                      {ns.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                onClick={refreshData}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing resources in: <strong>{selectedNamespace || 'All Namespaces'}</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Gateways Table */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gateways
            </Typography>
            {loadingGateways ? (
              <SkeletonTable rows={3} cols={5} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Namespace</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Gateway Class</TableCell>
                      <TableCell>Listeners</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gateways.map((gateway) => (
                      <TableRow key={`${gateway.namespace}-${gateway.name}`}>
                        <TableCell>{gateway.name}</TableCell>
                        <TableCell>
                          <Chip label={gateway.namespace} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={gateway.status} 
                            color={getStatusColor(gateway.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{gateway.gatewayClassName}</TableCell>
                        <TableCell>{gateway.listeners?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                    {gateways.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">
                            No gateways found{selectedNamespace ? ` in namespace "${selectedNamespace}"` : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Routes Table */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Routes
            </Typography>
            {loadingRoutes ? (
              <SkeletonTable rows={3} cols={5} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Namespace</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Hostnames</TableCell>
                      <TableCell>Rules</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={`${route.namespace}-${route.name}`}>
                        <TableCell>{route.name}</TableCell>
                        <TableCell>
                          <Chip label={route.namespace} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={route.status} 
                            color={getStatusColor(route.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{route.hostnames?.join(', ') || 'None'}</TableCell>
                        <TableCell>{route.rules?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                    {routes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">
                            No routes found{selectedNamespace ? ` in namespace "${selectedNamespace}"` : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Setup Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🚀 Quick Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Get started with Envoy Gateway quickly for learning and local development.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              disabled
              sx={{ mr: 2 }}
            >
              Quick Setup (Coming Soon)
            </Button>
            <Typography variant="caption" color="text.secondary">
              One-click installation and example templates will be available in Phase 2
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

function App({ ddClient }: AppProps) {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppContent ddClient={ddClient} />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
