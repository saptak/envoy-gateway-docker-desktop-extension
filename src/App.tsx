import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Layout components
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import Gateways from './pages/Gateways';
import GatewayDetail from './pages/GatewayDetail';
import Routes from './pages/Routes';
import RouteDetail from './pages/RouteDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Services
import webSocketService from './services/websocket';
import { apiService } from './services/api';

// Redux
import { RootState } from './store';
import { setTheme, setLoading, addNotification } from './store/slices/uiSlice';
import { setSystemStatus } from './store/slices/systemSlice';
import { setGateways } from './store/slices/gatewaySlice';
import { setRoutes } from './store/slices/routeSlice';
import { setMetrics } from './store/slices/monitoringSlice';

// Theme
import { lightTheme, darkTheme } from './theme';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { theme, loading } = useSelector((state: RootState) => state.ui);
  const [initialized, setInitialized] = useState(false);

  // Create theme based on current theme setting
  const currentTheme = createTheme(theme === 'dark' ? darkTheme : lightTheme);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch(setLoading(true));
        
        // Connect to WebSocket
        await webSocketService.connect();
        
        // Set up WebSocket event listeners
        webSocketService.on('system:status', (data) => {
          dispatch(setSystemStatus(data));
        });
        
        webSocketService.on('gateway:update', (data) => {
          // Refresh gateways list
          apiService.getGateways().then((gateways) => {
            dispatch(setGateways(gateways));
          });
        });
        
        webSocketService.on('route:update', (data) => {
          // Refresh routes list
          apiService.getHTTPRoutes().then((routes) => {
            dispatch(setRoutes(routes));
          });
        });
        
        webSocketService.on('metrics:update', (data) => {
          dispatch(setMetrics(data));
        });
        
        // Subscribe to metrics updates
        webSocketService.subscribeToMetrics();
        
        // Initial data fetch
        const systemStatus = await apiService.getSystemStatus();
        dispatch(setSystemStatus(systemStatus));
        
        const gateways = await apiService.getGateways();
        dispatch(setGateways(gateways));
        
        const routes = await apiService.getHTTPRoutes();
        dispatch(setRoutes(routes));
        
        setInitialized(true);
        dispatch(setLoading(false));
        
        // Add welcome notification
        dispatch(addNotification({
          id: 'welcome',
          type: 'info',
          title: 'Welcome to Envoy Gateway',
          message: 'The extension is ready to use.',
          duration: 5000,
        }));
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch(setLoading(false));
        dispatch(addNotification({
          id: 'init-error',
          type: 'error',
          title: 'Initialization Error',
          message: 'Failed to connect to the backend services.',
          duration: 0, // Persistent notification
        }));
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [dispatch]);

  // Show loading screen while initializing
  if (loading && !initialized) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <LoadingScreen message="Loading Envoy Gateway..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gateways" element={<Gateways />} />
              <Route path="/gateways/:namespace/:name" element={<GatewayDetail />} />
              <Route path="/routes" element={<Routes />} />
              <Route path="/routes/:namespace/:name" element={<RouteDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster position="top-right" />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
