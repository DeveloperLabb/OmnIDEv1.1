import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentModal from './AssignmentModal';
import ConfigurationModal from './ConfigurationModal';
import { createAssignment } from '../services/api';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
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

  const handleSubmitAssignment = async (data) => {
    try {
      setIsSubmitting(true);
      await createAssignment(data);
      handleCloseAssignmentModal();
      // You could add a success notification here
      
      // Instead of reloading the page, handle state update or fetch new assignments
      // You could add a callback to refresh assignments in the sidebar
      // For example: refreshAssignments();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      // You could add error handling here
    } finally {
      setIsSubmitting(false);
    }
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
          <Typography variant="h6" noWrap component="div">
            OmnIDE
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          
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