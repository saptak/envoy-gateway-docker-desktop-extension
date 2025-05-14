import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as ConnectedIcon,
  Error as DisconnectedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { useAppSelector } from '@/hooks/redux';
import { formatRelativeTime } from '@/utils';

const ConnectionStatus: React.FC = () => {
  const theme = useTheme();
  const { connected, lastUpdated, status } = useAppSelector(state => state.system);

  const getStatusInfo = () => {
    if (!connected) {
      return {
        label: 'Disconnected',
        color: theme.palette.error.main,
        icon: <DisconnectedIcon fontSize="small" />,
        tooltip: 'Not connected to backend services',
      };
    }

    if (!status) {
      return {
        label: 'Connecting',
        color: theme.palette.warning.main,
        icon: <WarningIcon fontSize="small" />,
        tooltip: 'Connecting to services...',
      };
    }

    const dockerConnected = status.docker.connected;
    const kubernetesConnected = status.kubernetes.connected;
    const envoyGatewayStatus = status.envoyGateway.status;

    if (dockerConnected && kubernetesConnected && envoyGatewayStatus === 'running') {
      return {
        label: 'Connected',
        color: theme.palette.success.main,
        icon: <ConnectedIcon fontSize="small" />,
        tooltip: `All services connected${lastUpdated ? ` • Updated ${formatRelativeTime(lastUpdated)}` : ''}`,
      };
    }

    if (!dockerConnected || !kubernetesConnected) {
      return {
        label: 'Partial',
        color: theme.palette.warning.main,
        icon: <WarningIcon fontSize="small" />,
        tooltip: `${!dockerConnected ? 'Docker' : ''} ${!dockerConnected && !kubernetesConnected ? 'and ' : ''}${!kubernetesConnected ? 'Kubernetes' : ''} not connected`,
      };
    }

    return {
      label: 'Partial',
      color: theme.palette.warning.main,
      icon: <WarningIcon fontSize="small" />,
      tooltip: `Envoy Gateway status: ${envoyGatewayStatus}`,
    };
  };

  const { label, color, icon, tooltip } = getStatusInfo();

  return (
    <Tooltip title={tooltip} arrow>
      <Box>
        <Chip
          icon={icon}
          label={label}
          size="small"
          sx={{
            backgroundColor: color + '20',
            color: color,
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: color,
            },
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default ConnectionStatus;
