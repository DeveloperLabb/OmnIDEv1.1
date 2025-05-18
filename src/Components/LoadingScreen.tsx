import React, { useState, useEffect } from 'react';
import {
  Box, CircularProgress, Typography, LinearProgress,
  Backdrop
} from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  overlay?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading application...',
  overlay = false
}) => {
  const [dots, setDots] = useState('');

  // Animated dots for loading message
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Main loading content
  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={overlay ? 40 : 60} thickness={4} />
      <Typography variant={overlay ? "body1" : "h6"} sx={{ mt: 2, color: overlay ? 'white' : 'inherit' }}>
        {message}{dots}
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 300, mt: 2 }}>
        <LinearProgress />
      </Box>
    </Box>
  );

  // If overlay mode is requested, use a Backdrop component
  if (overlay) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
        open={true}
      >
        {content}
      </Backdrop>
    );
  }

  // Otherwise use a full-screen fixed position container
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999,
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingScreen;