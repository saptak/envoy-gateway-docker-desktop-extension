import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Router as RouterIcon } from '@mui/icons-material';

interface LogoProps {
  collapsed?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ collapsed = false, size = 'medium' }) => {
  const theme = useTheme();
  
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 24, fontSize: '1rem' };
      case 'large':
        return { iconSize: 48, fontSize: '1.5rem' };
      default:
        return { iconSize: 32, fontSize: '1.25rem' };
    }
  };

  const { iconSize, fontSize } = getSizeConfig();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <RouterIcon 
          sx={{ 
            color: 'white', 
            fontSize: iconSize * 0.7,
          }} 
        />
      </Box>
      {!collapsed && (
        <Typography
          variant="h6"
          sx={{
            ml: 1.5,
            fontWeight: 700,
            fontSize,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Envoy Gateway
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
