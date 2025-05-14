import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import Logo from './Logo';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading Envoy Gateway...' 
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Logo size="large" />
      </Box>
      
      <CircularProgress
        size={48}
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
          mb: 3,
        }}
      />
      
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ textAlign: 'center' }}
      >
        {message}
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ opacity: 0.7 }}
        >
          Please wait while we initialize the extension...
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
