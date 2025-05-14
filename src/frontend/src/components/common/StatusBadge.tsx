import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { getStatusColor } from '@/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'filled',
  size = 'small',
  showIcon = false,
  className,
}) => {
  const theme = useTheme();
  const color = getStatusColor(status);
  
  const getColorValue = () => {
    switch (color) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const colorValue = getColorValue();
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Chip
      label={capitalizedStatus}
      size={size}
      variant={variant}
      className={className}
      sx={{
        backgroundColor: variant === 'filled' ? `${colorValue}20` : 'transparent',
        color: colorValue,
        borderColor: variant === 'outlined' ? colorValue : 'transparent',
        fontWeight: 600,
        textTransform: 'capitalize',
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
};

export default StatusBadge;
