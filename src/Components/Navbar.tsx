import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { createAssignment } from '../services/api';
import AssignmentModal from './AssignmentModal';

interface AssignmentData {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
}

const Navbar: React.FC = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  const handleAddAssignment = async (formData: AssignmentData) => {
    try {
      const response = await createAssignment(formData);
      setSnackbar({
        open: true,
        message: `Assignment ${response.assignment_name} created successfully!`,
        severity: 'success'
      });
      handleModalClose();
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
              onClick={handleModalOpen}
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

      <AssignmentModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleAddAssignment}
      />

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