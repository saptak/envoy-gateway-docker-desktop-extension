import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';

interface QuickSetupCardProps {
  onQuickSetup: () => Promise<any>;
  disabled?: boolean;
}

interface SetupStatus {
  dockerDesktopRunning: boolean;
  kubernetesEnabled: boolean;
  envoyGatewayInstalled: boolean;
  namespaceReady: boolean;
  gatewayClassCreated: boolean;
}

export const QuickSetupCard: React.FC<QuickSetupCardProps> = ({
  onQuickSetup,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock status for demo
  const mockStatus: SetupStatus = {
    dockerDesktopRunning: true,
    kubernetesEnabled: true,
    envoyGatewayInstalled: false,
    namespaceReady: false,
    gatewayClassCreated: false
  };

  const getStatusIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircleIcon color="success" />
    ) : (
      <WarningIcon color="warning" />
    );
  };

  const handleQuickSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await onQuickSetup();
      setResult(result);
      if (!result.success) {
        setError(result.message || 'Setup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isSetupComplete = () => {
    return mockStatus.envoyGatewayInstalled && 
           mockStatus.namespaceReady && 
           mockStatus.gatewayClassCreated;
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <RocketLaunchIcon color="primary" />
            <Typography variant="h6">
              🚀 Quick Setup
            </Typography>
            {isSetupComplete() && (
              <Chip label="Complete" color="success" size="small" />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started with Envoy Gateway quickly for learning and local development.
            This will install Envoy Gateway with sensible defaults on your Docker Desktop Kubernetes cluster.
          </Typography>

          {loading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Installing Envoy Gateway...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          )}

          {result && result.success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {result.message}
              </Typography>
            </Alert>
          )}

          <Box display="flex" gap={2} alignItems="center">
            <Button 
              variant="contained" 
              color="primary"
              disabled={disabled || loading || isSetupComplete()}
              onClick={handleQuickSetup}
              startIcon={loading ? null : <PlayArrowIcon />}
              size="large"
            >
              {loading ? 'Installing...' : isSetupComplete() ? 'Already Installed' : 'Quick Setup'}
            </Button>

            <Button 
              variant="outlined"
              onClick={() => setShowDetails(true)}
              startIcon={<InfoIcon />}
            >
              View Details
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            One-click installation with example gateway and route configurations
          </Typography>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Quick Setup Details</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            The quick setup will perform the following steps:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(mockStatus.dockerDesktopRunning)}
              </ListItemIcon>
              <ListItemText
                primary="Docker Desktop Running"
                secondary="Verify Docker Desktop is running and accessible"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {getStatusIcon(mockStatus.kubernetesEnabled)}
              </ListItemIcon>
              <ListItemText
                primary="Kubernetes Enabled"
                secondary="Ensure Kubernetes is enabled in Docker Desktop"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {getStatusIcon(mockStatus.envoyGatewayInstalled)}
              </ListItemIcon>
              <ListItemText
                primary="Install Envoy Gateway"
                secondary="Download and apply Envoy Gateway manifests"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {getStatusIcon(mockStatus.namespaceReady)}
              </ListItemIcon>
              <ListItemText
                primary="Create Namespace"
                secondary="Set up envoy-gateway-system namespace"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {getStatusIcon(mockStatus.gatewayClassCreated)}
              </ListItemIcon>
              <ListItemText
                primary="Configure Gateway Class"
                secondary="Create default EnvoyGateway GatewayClass"
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This setup is designed for local development and learning. 
              For production deployments, please refer to the official documentation.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickSetupCard;
