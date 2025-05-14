import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';

import App from '../../src/App';
import uiReducer from '../../src/store/slices/uiSlice';
import systemReducer from '../../src/store/slices/systemSlice';
import gatewayReducer from '../../src/store/slices/gatewaySlice';
import routeReducer from '../../src/store/slices/routeSlice';
import containerReducer from '../../src/store/slices/containerSlice';
import monitoringReducer from '../../src/store/slices/monitoringSlice';
import testingReducer from '../../src/store/slices/testingSlice';

// Mock the WebSocket service
jest.mock('../../src/services/websocket', () => ({
  __esModule: true,
  default: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    on: jest.fn().mockReturnValue(() => {}),
    send: jest.fn(),
    subscribeToMetrics: jest.fn(),
    unsubscribeFromMetrics: jest.fn(),
    isConnected: jest.fn().mockReturnValue(false),
  },
  webSocketService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    on: jest.fn().mockReturnValue(() => {}),
    send: jest.fn(),
    subscribeToMetrics: jest.fn(),
    unsubscribeFromMetrics: jest.fn(),
    isConnected: jest.fn().mockReturnValue(false),
  },
}));

// Mock the API service
jest.mock('../../src/services/api', () => ({
  apiService: {
    getSystemStatus: jest.fn().mockResolvedValue({
      docker: { connected: true, containers: { running: 2, stopped: 0, total: 2 } },
      kubernetes: { connected: true, context: 'test-context', namespace: 'default' },
      envoyGateway: { installed: true, status: 'running', version: '1.0.0' },
    }),
    healthCheck: jest.fn().mockResolvedValue({ status: 'ok', timestamp: Date.now() }),
    getGateways: jest.fn().mockResolvedValue([]),
    getHTTPRoutes: jest.fn().mockResolvedValue([]),
    getContainers: jest.fn().mockResolvedValue([]),
    getMetrics: jest.fn().mockResolvedValue({
      timestamp: Date.now(),
      gateways: { total: 0, healthy: 0, unhealthy: 0 },
      routes: { total: 0, attached: 0, detached: 0 },
      traffic: { requestRate: 0, errorRate: 0, p50Latency: 0, p95Latency: 0, p99Latency: 0 },
      resources: { cpu: { usage: 0, limit: 1000 }, memory: { usage: 0, limit: 1024 } },
    }),
  },
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      system: systemReducer,
      gateways: gatewayReducer,
      routes: routeReducer,
      containers: containerReducer,
      monitoring: monitoringReducer,
      testing: testingReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any; initialEntries?: string[] }> = ({ 
  children, 
  store = createTestStore(),
  initialEntries = ['/']
}) => {
  const theme = createTheme();
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Check if the app renders
    expect(screen.getByText('Envoy Gateway')).toBeInTheDocument();
  });

  test('displays loading screen initially', () => {
    const store = createTestStore({
      ui: { 
        loading: true,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [],
        error: null,
      }
    });

    render(
      <TestWrapper store={store}>
        <App />
      </TestWrapper>
    );

    expect(screen.getByText('Loading Envoy Gateway...')).toBeInTheDocument();
  });

  test('navigates to different routes', async () => {
    const store = createTestStore({
      ui: { 
        loading: false,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [],
        error: null,
      },
      system: {
        status: null,
        connected: false,
        lastUpdated: null,
        loading: false,
        error: null,
        connectionHistory: [],
      }
    });

    render(
      <TestWrapper store={store}>
        <App />
      </TestWrapper>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Test navigation to gateways
    const gatewaysLink = screen.getByRole('button', { name: /gateways/i });
    fireEvent.click(gatewaysLink);

    // Since we're testing routing, we'll check for the presence of navigation elements
    await waitFor(() => {
      expect(gatewaysLink).toHaveClass('Mui-selected') || 
      expect(window.location.pathname).toBe('/gateways');
    });
  });

  test('handles theme switching', async () => {
    const store = createTestStore({
      ui: { 
        loading: false,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [],
        error: null,
      }
    });

    render(
      <TestWrapper store={store}>
        <App />
      </TestWrapper>
    );

    // Find the user menu button
    const userMenuButton = screen.getByRole('button', { name: /account/i });
    fireEvent.click(userMenuButton);

    // Click on dark theme option
    await waitFor(() => {
      const darkThemeOption = screen.getByText('Dark Theme');
      fireEvent.click(darkThemeOption);
    });

    // Check if theme changed in store
    const state = store.getState();
    expect(state.ui.theme).toBe('dark');
  });

  test('displays system status correctly', async () => {
    const store = createTestStore({
      ui: { 
        loading: false,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [],
        error: null,
      },
      system: {
        status: {
          docker: { connected: true, containers: { running: 2, stopped: 0, total: 2 } },
          kubernetes: { connected: true, context: 'test-context', namespace: 'default' },
          envoyGateway: { installed: true, status: 'running', version: '1.0.0' },
        },
        connected: true,
        lastUpdated: Date.now(),
        loading: false,
        error: null,
        connectionHistory: [],
      }
    });

    render(
      <TestWrapper store={store}>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('System Connected')).toBeInTheDocument();
    });
  });

  test('handles sidebar collapse/expand', () => {
    const store = createTestStore({
      ui: { 
        loading: false,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [],
        error: null,
      }
    });

    render(
      <TestWrapper store={store}>
        <App />
      </TestWrapper>
    );

    // Find and click the sidebar toggle button
    const sidebarToggle = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(sidebarToggle);

    // Check if sidebar state changed
    const state = store.getState();
    expect(state.ui.sidebarCollapsed).toBe(true);
  });

  test('displays notifications', async () => {
    const testNotification = {
      id: 'test-notification',
      type: 'success',
      title: 'Test Notification',
      message: 'This is a test notification',
      timestamp: Date.now(),
      duration: 5000,
    };

    const store = createTestStore({
      ui: { 
        loading: false,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [testNotification],
        error: null,
      }
    });

    render(
      <TestWrapper store={store}>
        <App />
      </TestWrapper>
    );

    // Check for notification center with badge
    const notificationButton = screen.getByRole('button');
    expect(notificationButton).toBeInTheDocument();

    // Click to open notification center
    fireEvent.click(notificationButton);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    });
  });

  test('handles error boundaries', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const store = createTestStore({
      ui: { 
        loading: false,
        theme: 'light',
        sidebarCollapsed: false,
        activeTab: 'overview',
        notifications: [],
        error: null,
      }
    });

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper store={store}>
        <ThrowError />
      </TestWrapper>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
