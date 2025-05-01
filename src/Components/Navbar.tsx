import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AssignmentModal from './AssignmentModal';
import ConfigurationModal from './ConfigurationModal';
import { createAssignment } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  toggleSidebar: () => void;
  goToHome?: () => void; 
  onAssignmentCreated?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, goToHome, onAssignmentCreated }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAssignmentModal = () => {
    setAssignmentModalOpen(true);
  };

  const handleCloseAssignmentModal = () => {
    setAssignmentModalOpen(false);
  };

  const handleOpenConfigModal = () => {
    setConfigModalOpen(true);
  };

  const handleCloseConfigModal = () => {
    setConfigModalOpen(false);
  };

  const handleLogoClick = () => {
    if (goToHome) {
      goToHome();
    }
  };

  const handleSubmitAssignment = async (data) => {
    try {
      setIsSubmitting(true);
      await createAssignment(data);
      handleCloseAssignmentModal();
      
      // Refresh assignments list after creating a new one
      if (onAssignmentCreated) {
        onAssignmentCreated();
      }
      
      showSnackbar('Assignment created successfully', 'success');
    } catch (error) {
      console.error('Failed to create assignment:', error);
      showSnackbar(`Failed to create assignment: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function for snackbar
  const showSnackbar = (message, severity) => {
    // You can add snackbar state and component here if it doesn't exist
  };

  const handleSubmitConfiguration = async (data) => {
    try {
      setIsSubmitting(true);
      // API call to create configuration will be implemented later
      console.log('Configuration data:', data);
      handleCloseConfigModal();
      window.location.reload();
    } catch (error) {
      console.error('Failed to create configuration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            onClick={handleLogoClick}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { 
                opacity: 0.8 
              },
              transition: 'opacity 250ms ease'
            }}
          >
            OmnIDE
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton 
              color="inherit" 
              onClick={toggleDarkMode} 
              sx={{ mr: 2 }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={handleOpenAssignmentModal}
            sx={{ mr: 2 }}
          >
            Add Assignment
          </Button>
          
          <Button
            variant="contained"
            color="info"
            startIcon={<SettingsIcon />}
            onClick={handleOpenConfigModal}
            sx={{ mr: 2 }}
          >
            Configuration
          </Button>
        </Toolbar>
      </AppBar>

      <AssignmentModal
        open={assignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        onSubmit={handleSubmitAssignment}
      />
      
      <ConfigurationModal
        open={configModalOpen}
        onClose={handleCloseConfigModal}
        onSubmit={handleSubmitConfiguration}
      />
    </>
  );
};

export default Navbar;