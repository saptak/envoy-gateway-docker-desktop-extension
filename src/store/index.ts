import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import systemReducer from './slices/systemSlice';
import gatewayReducer from './slices/gatewaySlice';
import routeReducer from './slices/routeSlice';
import containerReducer from './slices/containerSlice';
import monitoringReducer from './slices/monitoringSlice';
import testingReducer from './slices/testingSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    system: systemReducer,
    gateways: gatewayReducer,
    routes: routeReducer,
    containers: containerReducer,
    monitoring: monitoringReducer,
    testing: testingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ui/addNotification'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp', 'payload.createdAt', 'payload.updatedAt'],
        // Ignore these paths in the state
        ignoredPaths: [
          'ui.notifications',
          'system.lastUpdated',
          'monitoring.metrics.timestamp',
          'monitoring.metricsHistory',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
