import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define the route interface
export interface Route {
  id: string;
  name: string;
  namespace: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  parentRefs: Array<{
    name: string;
    namespace: string;
  }>;
  rules: any[];
}

// Define the state interface
interface RouteState {
  routes: Route[];
  selectedRoute: Route | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: RouteState = {
  routes: [],
  selectedRoute: null,
  loading: false,
  error: null,
};

// Create the slice
const routeSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    // Set all routes
    setRoutes: (state, action: PayloadAction<Route[]>) => {
      state.routes = action.payload;
      state.error = null;
    },
    
    // Set selected route
    setSelectedRoute: (state, action: PayloadAction<Route | null>) => {
      state.selectedRoute = action.payload;
    },
    
    // Add a new route
    addRoute: (state, action: PayloadAction<Route>) => {
      state.routes.push(action.payload);
    },
    
    // Update an existing route
    updateRoute: (state, action: PayloadAction<Route>) => {
      const index = state.routes.findIndex(r => 
        r.namespace === action.payload.namespace && r.name === action.payload.name
      );
      
      if (index !== -1) {
        state.routes[index] = action.payload;
        
        // Update selected route if it's the same one
        if (state.selectedRoute && 
            state.selectedRoute.namespace === action.payload.namespace && 
            state.selectedRoute.name === action.payload.name) {
          state.selectedRoute = action.payload;
        }
      }
    },
    
    // Remove a route
    removeRoute: (state, action: PayloadAction<{ namespace: string; name: string }>) => {
      state.routes = state.routes.filter(
        r => !(r.namespace === action.payload.namespace && r.name === action.payload.name)
      );
      
      // Clear selected route if it's the same one
      if (state.selectedRoute && 
          state.selectedRoute.namespace === action.payload.namespace && 
          state.selectedRoute.name === action.payload.name) {
        state.selectedRoute = null;
      }
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  setRoutes,
  setSelectedRoute,
  addRoute,
  updateRoute,
  removeRoute,
  setLoading,
  setError,
} = routeSlice.actions;

// Export selectors
export const selectRoutes = (state: RootState) => state.routes.routes;
export const selectSelectedRoute = (state: RootState) => state.routes.selectedRoute;
export const selectRouteLoading = (state: RootState) => state.routes.loading;
export const selectRouteError = (state: RootState) => state.routes.error;

// Export reducer
export default routeSlice.reducer;
