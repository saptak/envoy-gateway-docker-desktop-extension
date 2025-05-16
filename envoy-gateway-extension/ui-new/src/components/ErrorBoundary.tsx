import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ fontSize: 48, mr: 2 }} />
                <Box>
                  <Typography variant="h5" component="h2" color="error">
                    Something went wrong
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    An unexpected error occurred in the application
                  </Typography>
                </Box>
              </Box>

              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Error Details</AlertTitle>
                {this.state.error?.message || 'Unknown error occurred'}
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <BugReportIcon sx={{ mr: 1 }} />
                    <Typography>Developer Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Error Message:
                      </Typography>
                      <Typography
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          mb: 2
                        }}
                      >
                        {this.state.error.message}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Stack Trace:
                      </Typography>
                      <Typography
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          mb: 2,
                          fontSize: '0.75rem'
                        }}
                      >
                        {this.state.error.stack}
                      </Typography>

                      {this.state.errorInfo && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Component Stack:
                          </Typography>
                          <Typography
                            component="pre"
                            sx={{
                              backgroundColor: 'grey.100',
                              p: 1,
                              borderRadius: 1,
                              overflow: 'auto',
                              fontSize: '0.75rem'
                            }}
                          >
                            {this.state.errorInfo.componentStack}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends {}>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
