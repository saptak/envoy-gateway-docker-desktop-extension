import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define notification interface
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp?: number;
  duration?: number; // in milliseconds, 0 for persistent
}

// Define UI state interface
interface UIState {
  loading: boolean;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeTab: string;
  notifications: Notification[];
  error: string | null;
}

// Initial state
const initialState: UIState = {
  loading: false,
  theme: 'light',
  sidebarCollapsed: false,
  activeTab: 'dashboard',
  notifications: [],
  error: null,
};

// Create the slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set theme
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    // Toggle theme
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Set sidebar collapsed state
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    // Toggle sidebar
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Set active tab
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    
    // Add notification
    addNotification: (state, action: PayloadAction<Notification>) => {
      const notification = {
        ...action.payload,
        timestamp: action.payload.timestamp || Date.now(),
      };
      
      // Remove existing notification with the same ID if it exists
      state.notifications = state.notifications.filter(n => n.id !== notification.id);
      
      // Add the new notification
      state.notifications.push(notification);
    },
    
    // Remove notification
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  setLoading,
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  setActiveTab,
  addNotification,
  removeNotification,
  clearNotifications,
  setError,
} = uiSlice.actions;

// Export selectors
export const selectLoading = (state: RootState) => state.ui.loading;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectActiveTab = (state: RootState) => state.ui.activeTab;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectError = (state: RootState) => state.ui.error;

// Export reducer
export default uiSlice.reducer;
