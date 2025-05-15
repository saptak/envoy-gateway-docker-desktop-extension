import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Router as GatewayIcon,
  Route as RouteIcon,
  Storage as ContainerIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useSystemStatus, useGateways, useRoutes, useContainers, useMonitoring } from '@/hooks/useApi';
import { MetricCard, StatusBadge, NamespaceSelector } from '@/components/common';
import { formatNumber, formatBytes, formatPercentage, getConditionStatus } from '@/utils';
import { fetchNamespaces, setSelectedNamespace } from '@/store/slices/namespaceSlice';

const Overview: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { status: systemStatus, connected, refresh: refreshSystem } = useSystemStatus();
  const { gateways } = useGateways();
  const { routes } = useRoutes();
  const { containers } = useContainers();
  const { currentMetrics } = useMonitoring();

  // Namespace state
  const { namespaces, selectedNamespace, loading: namespacesLoading } = useAppSelector(state => state.namespace);

  useEffect(() => {
    // Fetch namespaces on component mount
    dispatch(fetchNamespaces(false));
  }, [dispatch]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleRefresh = () => {
    refreshSystem();
    dispatch(fetchNamespaces(false));
  };

  const handleNamespaceChange = (namespace: string) => {
    dispatch(setSelectedNamespace(namespace));
  };

  // Filter resources based on selected namespace
  const filteredGateways = React.useMemo(() => {
    if (!selectedNamespace) return gateways;
    return gateways.filter(g => g.namespace === selectedNamespace);
  }, [gateways, selectedNamespace]);

  const filteredRoutes = React.useMemo(() => {
    if (!selectedNamespace) return routes;
    return routes.filter(r => r.namespace === selectedNamespace);
  }, [routes, selectedNamespace]);

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    const runningContainers = containers.filter(c => c.state === 'running').length;
    const healthyGateways = filteredGateways.filter(g => 
      getConditionStatus(g.status.conditions).status === 'healthy'
    ).length;
    const attachedRoutes = filteredRoutes.filter(r => 
      r.status.parents.some(p => p.conditions.some(c => c.type === 'Accepted' && c.status === 'True'))
    ).length;

    return {
      gateways: {
        total: filteredGateways.length,
        healthy: healthyGateways,
        unhealthy: filteredGateways.length - healthyGateways,
      },
      routes: {
        total: filteredRoutes.length,
        attached: attachedRoutes,
        detached: filteredRoutes.length - attachedRoutes,
      },
      containers: {
        total: containers.length,
        running: runningContainers,
        stopped: containers.length - runningContainers,
      },
    };
  }, [filteredGateways, filteredRoutes, containers]);

  // Quick actions
  const quickActions = [
    {
      title: 'Create Gateway',
      description: 'Set up a new API gateway',
      icon: <GatewayIcon />,
      color: 'primary' as const,
      action: () => handleNavigate('/gateways/create'),
    },
    {
      title: 'Create Route',
      description: 'Configure a new HTTP route',
      icon: <RouteIcon />,
      color: 'secondary' as const,
      action: () => handleNavigate('/routes/create'),
    },
    {
      title: 'Deploy Container',
      description: 'Launch Envoy Gateway container',
      icon: <ContainerIcon />,
      color: 'success' as const,
      action: () => handleNavigate('/containers/create'),
    },
  ];

  // Recent activities (mock data for now)
  const recentActivities = [
    {
      type: 'gateway',
      action: 'created',
      resource: 'api-gateway',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      type: 'route',
      action: 'updated',
      resource: 'auth-route',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      type: 'container',
      action: 'started',
      resource: 'envoy-proxy',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'gateway': return <GatewayIcon fontSize="small" />;
      case 'route': return <RouteIcon fontSize="small" />;
      case 'container': return <ContainerIcon fontSize="small" />;
      default: return <CheckCircleIcon fontSize="small" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created': return theme.palette.success.main;
      case 'updated': return theme.palette.warning.main;
      case 'deleted': return theme.palette.error.main;
      case 'started': return theme.palette.info.main;
      default: return theme.palette.text.secondary;
    }
  };

  // Calculate namespace counts for namespace selector
  const namespaceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    gateways.forEach(g => {
      counts[g.namespace] = (counts[g.namespace] || 0) + 1;
    });
    routes.forEach(r => {
      counts[r.namespace] = (counts[r.namespace] || 0) + 1;
    });
    return counts;
  }, [gateways, routes]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={600}>
            Dashboard Overview
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>

        {/* Namespace Selector */}
        <Box sx={{ mb: 2 }}>
          <NamespaceSelector
            selectedNamespace={selectedNamespace}
            onNamespaceChange={handleNamespaceChange}
            showAllNamespaces={!selectedNamespace}
            onToggleAllNamespaces={() => handleNamespaceChange('')}
            namespaces={namespaces}
            namespaceCounts={namespaceCounts}
            loading={namespacesLoading}
            className="w-64"
          />
        </Box>

        {/* Show current namespace filter */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing resources in:
          </Typography>
          <Chip 
            label={selectedNamespace || 'All Namespaces'} 
            size="small" 
            color={selectedNamespace ? 'primary' : 'default'}
          />
        </Box>
      </Box>

      {/* System Status Banner */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: connected ? 'success.main' : 'error.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {connected ? (
            <CheckCircleIcon fontSize="large" />
          ) : (
            <ErrorIcon fontSize="large" />
          )}
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {connected ? 'System Connected' : 'System Disconnected'}
            </Typography>
            <Typography variant="body2">
              {connected 
                ? 'All services are operational and responding normally'
                : 'Unable to connect to backend services'
              }
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Gateways"
            value={stats.gateways.total}
            color="primary"
            onClick={() => handleNavigate('/gateways')}
            change={stats.gateways.total > 0 ? {
              value: (stats.gateways.healthy / stats.gateways.total) * 100,
              type: 'increase',
              period: 'healthy'
            } : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="HTTP Routes"
            value={stats.routes.total}
            color="secondary"
            onClick={() => handleNavigate('/routes')}
            change={stats.routes.total > 0 ? {
              value: (stats.routes.attached / stats.routes.total) * 100,
              type: 'increase',
              period: 'attached'
            } : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Containers"
            value={stats.containers.running}
            unit={`of ${stats.containers.total}`}
            color="success"
            onClick={() => handleNavigate('/containers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Request Rate"
            value={currentMetrics?.traffic.requestRate || 0}
            unit="req/s"
            color="info"
            onClick={() => handleNavigate('/monitoring')}
            trend={[10, 20, 15, 25, 30, 35, 40]}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={action.action}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: `${action.color}.main` }}>
                          {action.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              System Health
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  {systemStatus?.docker.connected ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Docker"
                  secondary={`${systemStatus?.docker.containers.running || 0} containers running`}
                />
                <StatusBadge 
                  status={systemStatus?.docker.connected ? 'connected' : 'disconnected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {systemStatus?.kubernetes.connected ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Kubernetes"
                  secondary={`Context: ${systemStatus?.kubernetes.context || 'unknown'}`}
                />
                <StatusBadge 
                  status={systemStatus?.kubernetes.connected ? 'connected' : 'disconnected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {systemStatus?.envoyGateway.status === 'running' ? (
                    <CheckCircleIcon color="success" />
                  ) : systemStatus?.envoyGateway.installed ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Envoy Gateway"
                  secondary={`Version: ${systemStatus?.envoyGateway.version || 'unknown'}`}
                />
                <StatusBadge 
                  status={systemStatus?.envoyGateway.status || 'unknown'} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Recent Activity
            </Typography>
            <List dense>
              {recentActivities.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ color: getActivityColor(activity.action) }}>
                    {getActivityIcon(activity.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {activity.action} {activity.type} <strong>{activity.resource}</strong>
                      </Typography>
                    }
                    secondary={new Date(activity.timestamp).toLocaleTimeString()}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                size="small" 
                onClick={() => handleNavigate('/monitoring')}
              >
                View All Activity
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Overview;
