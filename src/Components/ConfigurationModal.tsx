import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { createConfiguration, updateConfiguration } from '../services/api';

interface ConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ConfigurationData) => void;
}

interface ConfigurationData {
  language_name: string;
  path: string;
}

interface SnackbarMessage {
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Available languages based on language_read.py
const SUPPORTED_LANGUAGES = [
  { name: "C", extension: ".c", command: "gcc" },
  { name: "C++", extension: ".cpp", command: "g++" },
  { name: "Java", extension: ".java", command: "javac" },
  { name: "C#", extension: ".cs", command: "dotnet" },
  { name: "Python", extension: ".py", command: "python3" },
  { name: "Go", extension: ".go", command: "go" },
  { name: "JavaScript", extension: ".js", command: "node" }
];

const API_BASE_URL = 'http://localhost:8000/api';

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ConfigurationData>({
    language_name: '',
    path: ''
  });
  const [configurations, setConfigurations] = useState<Array<ConfigurationData & { config_id: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  
  // Reference to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing configurations
  useEffect(() => {
    if (open) {
      fetchConfigurations();
    }
  }, [open]);

  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/configurations/`);
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      } else {
        console.error('Failed to fetch configurations');
        showSnackbar('Failed to fetch configurations', 'error');
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      showSnackbar('Error connecting to the server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editMode && currentConfigId) {
        await updateConfiguration(currentConfigId, formData);
        showSnackbar(`Configuration for ${formData.language_name} updated successfully`, 'success');
      } else {
        await createConfiguration(formData);
        showSnackbar(`Configuration for ${formData.language_name} added successfully`, 'success');
      }
      
      fetchConfigurations();
      resetForm();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showSnackbar('Failed to save configuration', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      language_name: '',
      path: ''
    });
    setEditMode(false);
    setCurrentConfigId(null);
  };

  const handleEdit = (config: any) => {
    setFormData({
      language_name: config.language_name,
      path: config.path
    });
    setEditMode(true);
    setCurrentConfigId(config.config_id);
  };

  const handleDelete = async (configId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/configurations/${configId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showSnackbar('Configuration deleted successfully', 'success');
        fetchConfigurations();
      } else {
        showSnackbar('Failed to delete configuration', 'error');
        console.error('Failed to delete configuration');
      }
    } catch (error) {
      showSnackbar('Error connecting to the server', 'error');
      console.error('Error deleting configuration:', error);
    }
  };

  // Helper to suggest a path based on selected language
  const getDefaultPath = (languageName: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.name === languageName);
    if (!language) return '';
    
    // Suggest default paths based on OS (Windows paths in this case)
    switch (language.name) {
      case 'Python':
        return 'C:\\Python310\\python.exe';
      case 'Java':
        return 'C:\\Program Files\\Java\\jdk\\bin\\javac.exe';
      case 'C':
        return 'C:\\MinGW\\bin\\gcc.exe';
      case 'C++':
        return 'C:\\MinGW\\bin\\g++.exe';
      case 'C#':
        return 'C:\\Program Files\\dotnet\\dotnet.exe';
      case 'Go':
        return 'C:\\Go\\bin\\go.exe';
      case 'JavaScript':
        return 'C:\\Program Files\\nodejs\\node.exe';
      default:
        return '';
    }
  };

  const handleLanguageChange = (event: any) => {
    const selectedLanguage = event.target.value;
    setFormData({
      ...formData,
      language_name: selectedLanguage,
      path: formData.path || getDefaultPath(selectedLanguage)
    });
  };

  // Handle file browser button click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle when a file is selected
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // In a browser environment, we can only get the filename, not the full path
      // In a real app using Electron, you could get the full path
      // For now, we'll use a fake path for demonstration
      const fakePath = files[0].name;
      
      // For a real Electron app, you would get the actual path
      // const actualPath = files[0].path;  
      
      setFormData({
        ...formData,
        path: fakePath
      });
      
      // Reset the file input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Show snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Configuration' : 'Add New Configuration'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel id="language-select-label">Programming Language</InputLabel>
                <Select
                  labelId="language-select-label"
                  id="language-select"
                  value={formData.language_name}
                  label="Programming Language"
                  onChange={handleLanguageChange}
                >
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <MenuItem key={language.name} value={language.name}>
                      {language.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Compiler/Interpreter Path"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                required
                fullWidth
                placeholder="e.g., C:\\Python310\\python.exe"
                helperText="Full path to the compiler or interpreter executable"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleBrowseClick}
                        aria-label="browse files"
                      >
                        <FolderOpenIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Hidden file input element */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".exe,.bat,.cmd,.sh,.jar"
              />
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Existing Configurations
              </Typography>
              <Divider />
              
              {loading ? (
                <Typography variant="body2" sx={{ py: 2 }}>Loading configurations...</Typography>
              ) : configurations.length > 0 ? (
                <List>
                  {configurations.map((config) => (
                    <ListItem
                      key={config.config_id}
                      secondaryAction={
                        <Box>
                          <IconButton edge="end" onClick={() => handleEdit(config)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDelete(config.config_id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">{config.language_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {config.path}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" sx={{ py: 2 }}>
                  No configurations found. Add your first configuration above.
                </Typography>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => {
              onClose();
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {editMode ? 'Update' : 'Add'} Configuration
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      {snackbar && (
        <Snackbar 
          open={true}
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default ConfigurationModal;