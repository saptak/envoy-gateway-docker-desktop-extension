import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import reducers
import uiReducer from './slices/uiSlice';
import systemReducer from './slices/systemSlice';
import gatewayReducer from './slices/gatewaySlice';
import routeReducer from './slices/routeSlice';
import containerReducer from './slices/containerSlice';
import monitoringReducer from './slices/monitoringSlice';
import testingReducer from './slices/testingSlice';
import namespaceReducer from './slices/namespaceSlice';

// Configure store
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    system: systemReducer,
    gateways: gatewayReducer,
    routes: routeReducer,
    containers: containerReducer,
    monitoring: monitoringReducer,
    testing: testingReducer,
    namespace: namespaceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['websocket/messageReceived'],
        ignoredPaths: ['websocket.socket'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup RTK Query listeners
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
