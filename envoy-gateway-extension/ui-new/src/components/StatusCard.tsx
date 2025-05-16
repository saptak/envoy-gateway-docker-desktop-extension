import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box,
  Alert
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';

interface StatusCardProps {
  backendStatus: {
    status: string;
    mode: string;
    timestamp: string;
    kubernetes: boolean;
    connection: string;
    context?: string;
  } | null;
  gatewayCount: number;
  routeCount: number;
  error?: string | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  backendStatus,
  gatewayCount,
  routeCount,
  error
}) => {
  const getConnectionIcon = () => {
    if (!backendStatus) return <WifiOffIcon color="error" />;
    return backendStatus.kubernetes ? <WifiIcon color="success" /> : <CloudIcon color="warning" />;
  };

  const getConnectionText = () => {
    if (!backendStatus) return 'Disconnected';
    if (backendStatus.mode === 'demo') return 'Demo Mode';
    return backendStatus.kubernetes ? 'Kubernetes Connected' : 'Demo Mode';
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              {getConnectionIcon()}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Backend Status
                </Typography>
                <Typography variant="h6">
                  {backendStatus?.status || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getConnectionText()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <StorageIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Kubernetes Context
                </Typography>
                <Typography variant="h6">
                  {backendStatus?.context || 'Not Connected'}
                </Typography>
                <Chip 
                  label={backendStatus?.kubernetes ? 'Live' : 'Demo'} 
                  size="small"
                  color={backendStatus?.kubernetes ? 'success' : 'warning'}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Gateways
              </Typography>
              <Typography variant="h6">{gatewayCount}</Typography>
              <Typography variant="caption" color="text.secondary">
                Active resources
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Routes
              </Typography>
              <Typography variant="h6">{routeCount}</Typography>
              <Typography variant="caption" color="text.secondary">
                HTTP routes
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
