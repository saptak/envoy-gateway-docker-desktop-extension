import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import { store } from '@/store';
import { useAppSelector } from '@/hooks/redux';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getPreferredTheme, setTheme } from '@/utils';

// Layout Components
import { Layout } from '@/components/Layout';
import { LoadingScreen, ErrorBoundary } from '@/components/common';

// Page Components
import {
  Overview,
  Gateways,
  Routes as RoutesPage,
  Containers,
  Monitoring,
  Testing,
  Configuration,
  Settings,
} from '@/components/pages';

// Theme hook
const useTheme = () => {
  const themeMode = useAppSelector(state => state.ui.theme);
  
  const theme = React.useMemo(() => {
    let mode: 'light' | 'dark';
    
    if (themeMode === 'auto') {
      mode = getPreferredTheme();
    } else {
      mode = themeMode;
    }
    
    return createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#90caf9' : '#1976d2',
        },
        secondary: {
          main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#ffffff' : '#000000',
          secondary: mode === 'dark' ? '#b3b3b3' : '#666666',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontSize: '2.5rem',
          fontWeight: 600,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 600,
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 600,
        },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              padding: '8px 16px',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: mode === 'dark' 
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
        },
      },
    });
  }, [themeMode]);
  
  useEffect(() => {
    const mode = theme.palette.mode;
    setTheme(mode);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.palette.background.default);
    }
  }, [theme]);
  
  return theme;
};

// App Content Component (needs to be inside Redux Provider)
const AppContent: React.FC = () => {
  const theme = useTheme();
  const { connected } = useWebSocket();
  const loading = useAppSelector(state => state.ui.loading);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/gateways/*" element={<Gateways />} />
              <Route path="/routes/*" element={<RoutesPage />} />
              <Route path="/containers/*" element={<Containers />} />
              <Route path="/monitoring/*" element={<Monitoring />} />
              <Route path="/testing/*" element={<Testing />} />
              <Route path="/configuration/*" element={<Configuration />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </Layout>
        </Router>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: theme.palette.success.main,
                secondary: theme.palette.success.contrastText,
              },
            },
            error: {
              iconTheme: {
                primary: theme.palette.error.main,
                secondary: theme.palette.error.contrastText,
              },
            },
          }}
        />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
