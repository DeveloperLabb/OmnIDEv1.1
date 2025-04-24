import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { createAssignment } from '../services/api';

const Navbar: React.FC = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddAssignment = async () => {
    try {
      const newAssignment = {
        assignment_no: Math.floor(Math.random() * 1000),
        assignment_date: new Date().toISOString().split('T')[0],
        assignment_percent: 100,
        correct_output: "Sample output"
      };

      const response = await createAssignment(newAssignment);
      setSnackbar({
        open: true,
        message: `Assignment ${response.assignment_no} created successfully!`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to create assignment',
        severity: 'error'
      });
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            width="100%"
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddAssignment}
              sx={{
                backgroundColor: 'white',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                fontWeight: 'bold',
              }}
            >
              Add Assignment
            </Button>

            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              OmnIDE
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;