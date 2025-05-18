import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading application...' }) => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  // Animated dots for loading message
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Simulated progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        // Slow down progress as it gets higher to simulate waiting for API
        const increment = Math.max(1, Math.floor((100 - prev) / 10));
        return Math.min(95, prev + increment); // Never reach 100% until actually loaded
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

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
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        {message}{dots}
      </Typography>
      <Box sx={{ width: '50%', maxWidth: 300 }}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
    </Box>
  );
};

export default LoadingScreen;