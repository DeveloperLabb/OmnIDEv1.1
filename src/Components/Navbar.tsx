import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Button, 
  Tooltip, 
  Menu, 
  MenuItem, 
  Snackbar, 
  Alert 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssignmentModal from './AssignmentModal';
import ConfigurationModal from './ConfigurationModal';
import UserManualModal from './UserManualModal';
import { createAssignment, importData, exportData } from '../services/api';
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
  const [userManualOpen, setUserManualOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const settingsMenuOpen = Boolean(settingsAnchorEl);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const handleOpenAssignmentModal = () => setAssignmentModalOpen(true);
  const handleCloseAssignmentModal = () => setAssignmentModalOpen(false);
  const handleOpenConfigModal = () => setConfigModalOpen(true);
  const handleCloseConfigModal = () => setConfigModalOpen(false);
  const handleUserManualOpen = () => {
    setUserManualOpen(true);
    handleSettingsClose();
  };
  const handleUserManualClose = () => setUserManualOpen(false);
  const handleLogoClick = () => goToHome && goToHome();
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => setSettingsAnchorEl(event.currentTarget);
  const handleSettingsClose = () => setSettingsAnchorEl(null);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        try {
          setIsSubmitting(true);
          const result = await importData(file);
          showSnackbar(result.message || 'Data imported successfully', 'success');
        } catch (error) {
          console.error('Import failed:', error);
          showSnackbar(`Import failed: ${error.message}`, 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
      document.body.removeChild(fileInput);
    };

    fileInput.click();
    handleSettingsClose();
  };

  const handleExport = async () => {
    try {
      setIsSubmitting(true);
      const blob = await exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `omniide_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar(`Export failed: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
      handleSettingsClose();
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
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            onClick={handleLogoClick}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 }, transition: 'opacity 250ms ease' }}
          >
            OmnIDE
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 2 }}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpenAssignmentModal} sx={{ mr: 2 }} disabled={isSubmitting}>
            Add Assignment
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<SettingsIcon />}
            onClick={handleOpenConfigModal}
            sx={{ mr: 2 }}
            disabled={isSubmitting}
          >
            Configuration
          </Button>
          <Tooltip title="Tools & Help">
            <IconButton color="inherit" onClick={handleSettingsClick} aria-controls={settingsMenuOpen ? 'settings-menu' : undefined} aria-haspopup="true" aria-expanded={settingsMenuOpen ? 'true' : undefined} disabled={isSubmitting}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="settings-menu"
            anchorEl={settingsAnchorEl}
            open={settingsMenuOpen}
            onClose={handleSettingsClose}
            MenuListProps={{ 'aria-labelledby': 'settings-button' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleImport} disabled={isSubmitting}>
              <FileUploadIcon fontSize="small" sx={{ mr: 1 }} />
              Import
            </MenuItem>
            <MenuItem onClick={handleExport} disabled={isSubmitting}>
              <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Export
            </MenuItem>
            <MenuItem onClick={handleUserManualOpen}>
              <HelpOutlineIcon fontSize="small" sx={{ mr: 1 }} />
              User Manual
            </MenuItem>
          </Menu>
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
      <UserManualModal
        open={userManualOpen}
        onClose={handleUserManualClose}
      />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;