import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import PendingIcon from '@mui/icons-material/Pending';
import BlockIcon from '@mui/icons-material/Block';

export type StatusType = 'healthy' | 'unhealthy' | 'warning' | 'pending' | 'unknown' | 'blocked' | 'ready' | 'not-ready' | 'degraded' | 'error' | 'success' | 'info';

interface StatusConfig {
  label: string;
  color: 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary' | 'secondary';
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  healthy: {
    label: 'Healthy',
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
  },
  ready: {
    label: 'Ready',
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
  },
  success: {
    label: 'Success',
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
  },
  unhealthy: {
    label: 'Unhealthy',
    color: 'error',
    icon: <ErrorIcon fontSize="small" />,
  },
  error: {
    label: 'Error',
    color: 'error',
    icon: <ErrorIcon fontSize="small" />,
  },
  'not-ready': {
    label: 'Not Ready',
    color: 'error',
    icon: <ErrorIcon fontSize="small" />,
  },
  warning: {
    label: 'Warning',
    color: 'warning',
    icon: <WarningIcon fontSize="small" />,
  },
  degraded: {
    label: 'Degraded',
    color: 'warning',
    icon: <WarningIcon fontSize="small" />,
  },
  pending: {
    label: 'Pending',
    color: 'info',
    icon: <PendingIcon fontSize="small" />,
  },
  info: {
    label: 'Info',
    color: 'info',
    icon: <HelpIcon fontSize="small" />,
  },
  unknown: {
    label: 'Unknown',
    color: 'default',
    icon: <HelpIcon fontSize="small" />,
  },
  blocked: {
    label: 'Blocked',
    color: 'error',
    icon: <BlockIcon fontSize="small" />,
  },
};

export interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  tooltip?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  iconOnly?: boolean;
  testId?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  tooltip,
  size = 'small',
  variant = 'filled',
  iconOnly = false,
  testId = 'status-badge',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const label = customLabel || config.label;
  
  const badge = (
    <Chip
      icon={config.icon}
      label={iconOnly ? undefined : label}
      color={config.color}
      size={size}
      variant={variant}
      data-testid={testId}
      sx={{
        height: iconOnly ? 24 : undefined,
        width: iconOnly ? 24 : undefined,
        '& .MuiChip-icon': {
          marginLeft: iconOnly ? '0px' : undefined,
          marginRight: iconOnly ? '0px' : undefined,
        },
      }}
    />
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        <Box component="span" sx={{ display: 'inline-flex' }}>
          {badge}
        </Box>
      </Tooltip>
    );
  }

  return badge;
};

export default StatusBadge;
