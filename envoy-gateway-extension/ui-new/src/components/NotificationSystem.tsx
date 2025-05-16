import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  SlideProps,
  Box,
  IconButton,
  AlertColor
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Notification types
export interface Notification {
  id: string;
  type: AlertColor;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  details?: any;
}

// Context types
interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  notifications: Notification[];
}

// Transition component for slide effect
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || (notification.type === 'error' ? 8000 : 6000)
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    showNotification,
    hideNotification,
    clearAllNotifications,
    notifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onClose={hideNotification} />
    </NotificationContext.Provider>
  );
};

// Notification container component
const NotificationContainer: React.FC<{
  notifications: Notification[];
  onClose: (id: string) => void;
}> = ({ notifications, onClose }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 400,
        width: '100%'
      }}
    >
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          TransitionComponent={SlideTransition}
          sx={{
            position: 'static',
            transform: 'none',
            marginBottom: index < notifications.length - 1 ? 1 : 0
          }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {notification.action && (
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={notification.action.onClick}
                  >
                    {notification.action.label}
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => onClose(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

// Hook to use notifications
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Convenience functions for different notification types
export const useNotificationHelpers = () => {
  const { showNotification } = useNotifications();

  return {
    showSuccess: (message: string, title?: string, options?: Partial<Notification>) =>
      showNotification({ type: 'success', title: title || 'Success', message, ...options }),

    showError: (message: string, title?: string, options?: Partial<Notification>) =>
      showNotification({ type: 'error', title: title || 'Error', message, ...options }),

    showWarning: (message: string, title?: string, options?: Partial<Notification>) =>
      showNotification({ type: 'warning', title: title || 'Warning', message, ...options }),

    showInfo: (message: string, title?: string, options?: Partial<Notification>) =>
      showNotification({ type: 'info', title: title || 'Information', message, ...options }),

    showApiError: (error: any, title?: string) => {
      // Handle structured API errors
      if (error?.response?.data?.error) {
        const apiError = error.response.data.error;
        showNotification({
          type: 'error',
          title: title || 'API Error',
          message: apiError.message,
          details: apiError.details,
          action: apiError.details ? {
            label: 'Details',
            onClick: () => console.log('Error details:', apiError.details)
          } : undefined
        });
      } else if (error?.response?.data?.message) {
        showNotification({
          type: 'error',
          title: title || 'Request Failed',
          message: error.response.data.message
        });
      } else if (error?.message) {
        showNotification({
          type: 'error',
          title: title || 'Error',
          message: error.message
        });
      } else {
        showNotification({
          type: 'error',
          title: title || 'Unknown Error',
          message: 'An unexpected error occurred'
        });
      }
    },

    showDemoModeWarning: () =>
      showNotification({
        type: 'warning',
        title: 'Demo Mode',
        message: 'Kubernetes not connected. Using demo data.',
        duration: 4000
      }),

    showKubernetesDisconnected: () =>
      showNotification({
        type: 'error',
        title: 'Kubernetes Disconnected',
        message: 'Connection to Kubernetes lost. Switching to demo mode.',
        duration: 8000
      }),

    showRetrying: (operation: string, attempt: number) =>
      showNotification({
        type: 'info',
        title: 'Retrying Operation',
        message: `Retrying ${operation} (attempt ${attempt})...`,
        duration: 3000
      })
  };
};
