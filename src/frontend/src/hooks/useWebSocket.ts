import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import webSocketService, { WebSocketEventMap } from '@/services/websocket';
import { 
  updateStatus,
  setConnected,
  addConnectionError
} from '@/store/slices/systemSlice';
import {
  updateGatewayStatus
} from '@/store/slices/gatewaySlice';
import {
  updateRouteStatus
} from '@/store/slices/routeSlice';
import {
  updateContainerStatus,
  appendContainerLogs
} from '@/store/slices/containerSlice';
import {
  updateMetrics,
  addLogEntry
} from '@/store/slices/monitoringSlice';
import {
  updateTestRun
} from '@/store/slices/testingSlice';
import {
  addNotification
} from '@/store/slices/uiSlice';

export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const connected = useAppSelector(state => state.system.connected);
  const isInitialized = useRef(false);

  const connect = useCallback(async () => {
    try {
      await webSocketService.connect();
      dispatch(setConnected(true));
    } catch (error: any) {
      dispatch(setConnected(false));
      dispatch(addConnectionError(error.message));
      dispatch(addNotification({
        type: 'error',
        title: 'WebSocket Connection Failed',
        message: error.message,
        duration: 5000
      }));
    }
  }, [dispatch]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    dispatch(setConnected(false));
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Set up event listeners
    const unsubscribers: Array<() => void> = [];

    // Connection status
    unsubscribers.push(
      webSocketService.on('connection_status', ({ connected }) => {
        dispatch(setConnected(connected));
      })
    );

    // System status updates
    unsubscribers.push(
      webSocketService.on('status_update', (status) => {
        dispatch(updateStatus(status));
      })
    );

    // Gateway changes
    unsubscribers.push(
      webSocketService.on('gateway_changed', ({ type, gateway }) => {
        dispatch(updateGatewayStatus(gateway));
        dispatch(addNotification({
          type: 'info',
          title: 'Gateway Updated',
          message: `Gateway ${gateway.name} was ${type}`,
          duration: 3000
        }));
      })
    );

    // Route changes
    unsubscribers.push(
      webSocketService.on('route_changed', ({ type, route }) => {
        dispatch(updateRouteStatus(route));
        dispatch(addNotification({
          type: 'info',
          title: 'Route Updated',
          message: `Route ${route.name} was ${type}`,
          duration: 3000
        }));
      })
    );

    // Metrics updates
    unsubscribers.push(
      webSocketService.on('metrics_update', (metrics) => {
        dispatch(updateMetrics(metrics));
      })
    );

    // Log entries
    unsubscribers.push(
      webSocketService.on('log_entry', (log) => {
        dispatch(addLogEntry(log));
      })
    );

    // Container changes
    unsubscribers.push(
      webSocketService.on('container_changed', ({ type, container }) => {
        dispatch(updateContainerStatus(container));
        dispatch(addNotification({
          type: 'info',
          title: 'Container Updated',
          message: `Container ${container.name} was ${type}`,
          duration: 3000
        }));
      })
    );

    // Test run updates
    unsubscribers.push(
      webSocketService.on('test_run_update', ({ runId, status, progress }) => {
        // This would typically trigger a fetch of the updated test run
        dispatch(addNotification({
          type: 'info',
          title: 'Test Run Update',
          message: `Test run ${runId} status: ${status}`,
          duration: 2000
        }));
      })
    );

    // Error handling
    unsubscribers.push(
      webSocketService.on('error', ({ message, code }) => {
        dispatch(addNotification({
          type: 'error',
          title: 'WebSocket Error',
          message: message,
          duration: 5000
        }));
      })
    );

    // Auto-connect
    connect();

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
      disconnect();
    };
  }, [dispatch, connect, disconnect]);

  return {
    connected,
    connect,
    disconnect,
    subscribe: webSocketService.subscribeToMetrics.bind(webSocketService),
    unsubscribe: webSocketService.unsubscribeFromMetrics.bind(webSocketService),
    send: webSocketService.send.bind(webSocketService)
  };
};

// Hook for subscribing to specific WebSocket events
export const useWebSocketEvent = <K extends keyof WebSocketEventMap>(
  event: K,
  callback: WebSocketEventMap[K]
) => {
  useEffect(() => {
    const unsubscribe = webSocketService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
};

// Hook for managing WebSocket subscriptions
export const useWebSocketSubscription = () => {
  const subscriptions = useRef<Set<string>>(new Set());

  const subscribe = useCallback((type: string, ...args: any[]) => {
    const key = `${type}-${JSON.stringify(args)}`;
    if (subscriptions.current.has(key)) return;

    subscriptions.current.add(key);
    
    switch (type) {
      case 'gateway':
        webSocketService.subscribeToGateway(args[0], args[1]);
        break;
      case 'route':
        webSocketService.subscribeToRoute(args[0], args[1]);
        break;
      case 'metrics':
        webSocketService.subscribeToMetrics(args[0]);
        break;
      case 'logs':
        webSocketService.subscribeTeLogs(args[0], args[1]);
        break;
    }
  }, []);

  const unsubscribe = useCallback((type: string, ...args: any[]) => {
    const key = `${type}-${JSON.stringify(args)}`;
    if (!subscriptions.current.has(key)) return;

    subscriptions.current.delete(key);
    
    switch (type) {
      case 'gateway':
        webSocketService.unsubscribeFromGateway(args[0], args[1]);
        break;
      case 'route':
        webSocketService.unsubscribeFromRoute(args[0], args[1]);
        break;
      case 'metrics':
        webSocketService.unsubscribeFromMetrics();
        break;
      case 'logs':
        webSocketService.unsubscribeFromLogs();
        break;
    }
  }, []);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.current.forEach(key => {
        const [type, ...args] = key.split('-');
        const parsedArgs = args.length > 0 ? JSON.parse(args.join('-')) : [];
        unsubscribe(type, ...parsedArgs);
      });
    };
  }, [unsubscribe]);

  return { subscribe, unsubscribe };
};
