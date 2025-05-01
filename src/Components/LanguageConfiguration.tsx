import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface LanguageConfig {
  id: string;
  name: string;
  compiler: string;
  compilerArgs: string;
  fileExtension: string;
  runCommand: string;
  runArgs: string;
  description: string;
}

const defaultConfigs: LanguageConfig[] = [
  {
    id: 'c_config',
    name: 'C Programming',
    compiler: '/usr/bin/gcc',
    compilerArgs: '-o {output} {input}',
    fileExtension: '.c',
    runCommand: './{output}',
    runArgs: '',
    description: 'Configuration for C programming language'
  },
  {
    id: 'cpp_config',
    name: 'C++ Programming',
    compiler: '/usr/bin/g++',
    compilerArgs: '-o {output} {input}',
    fileExtension: '.cpp',
    runCommand: './{output}',
    runArgs: '',
    description: 'Configuration for C++ programming language'
  },
  {
    id: 'java_config',
    name: 'Java Programming',
    compiler: '/usr/bin/javac',
    compilerArgs: '{input}',
    fileExtension: '.java',
    runCommand: 'java -cp {directory} {classname}',
    runArgs: '',
    description: 'Configuration for Java programming language'
  },
  {
    id: 'python_config',
    name: 'Python Programming',
    compiler: '',
    compilerArgs: '',
    fileExtension: '.py',
    runCommand: 'python {input}',
    runArgs: '',
    description: 'Configuration for Python programming language'
  }
];

const LanguageConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<LanguageConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<LanguageConfig | null>(null);
  const [newConfigOpen, setNewConfigOpen] = useState(false);
  const [editConfigOpen, setEditConfigOpen] = useState(false);
  const [importSnackbarOpen, setImportSnackbarOpen] = useState(false);
  const [exportSnackbarOpen, setExportSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for new/edit config
  const [formData, setFormData] = useState<LanguageConfig>({
    id: '',
    name: '',
    compiler: '',
    compilerArgs: '',
    fileExtension: '',
    runCommand: '',
    runArgs: '',
    description: ''
  });

  // Load configurations from localStorage on component mount
  useEffect(() => {
    const savedConfigs = localStorage.getItem('languageConfigs');
    if (savedConfigs) {
      try {
        setConfigs(JSON.parse(savedConfigs));
      } catch (error) {
        console.error('Error parsing saved configs:', error);
        // If there's an error, use the default configs
        setConfigs(defaultConfigs);
        localStorage.setItem('languageConfigs', JSON.stringify(defaultConfigs));
      }
    } else {
      // If no configs are saved, use the default configs
      setConfigs(defaultConfigs);
      localStorage.setItem('languageConfigs', JSON.stringify(defaultConfigs));
    }
  }, []);

  // Save configurations to localStorage whenever they change
  useEffect(() => {
    if (configs.length > 0) {
      localStorage.setItem('languageConfigs', JSON.stringify(configs));
    }
  }, [configs]);

  const handleAddConfig = () => {
    // Generate a unique ID
    const newId = `config_${Date.now()}`;
    setFormData({
      id: newId,
      name: '',
      compiler: '',
      compilerArgs: '',
      fileExtension: '',
      runCommand: '',
      runArgs: '',
      description: ''
    });
    setNewConfigOpen(true);
  };

  const handleEditConfig = (config: LanguageConfig) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setEditConfigOpen(true);
  };

  const handleDeleteConfig = (configId: string) => {
    setConfigs(configs.filter(config => config.id !== configId));
  };

  const handleSaveNewConfig = () => {
    // Validate form data
    if (!formData.name || !formData.fileExtension) {
      setErrorMessage('Name and file extension are required');
      return;
    }

    setConfigs([...configs, formData]);
    setNewConfigOpen(false);
    setErrorMessage(null);
  };

  const handleUpdateConfig = () => {
    // Validate form data
    if (!formData.name || !formData.fileExtension) {
      setErrorMessage('Name and file extension are required');
      return;
    }

    setConfigs(configs.map(config => 
      config.id === formData.id ? formData : config
    ));
    setEditConfigOpen(false);
    setSelectedConfig(null);
    setErrorMessage(null);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (e.target && e.target.result) {
            const importedConfigs = JSON.parse(e.target.result.toString());
            
            // Validate imported data
            if (Array.isArray(importedConfigs) && importedConfigs.every(config => 
              config.id && config.name && config.fileExtension
            )) {
              setConfigs(importedConfigs);
              setImportSnackbarOpen(true);
            } else {
              setErrorMessage('Invalid configuration format');
            }
          }
        } catch (error) {
          console.error('Error importing configurations:', error);
          setErrorMessage('Failed to import configurations');
        }
      };
      
      reader.readAsText(file);
    }
  };

  const handleExportConfig = () => {
    try {
      const configsJson = JSON.stringify(configs, null, 2);
      const blob = new Blob([configsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'language_configurations.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting configurations:', error);
      setErrorMessage('Failed to export configurations');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Language Configurations</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              component="label"
            >
              Import
              <input
                type="file"
                hidden
                accept=".json"
                onChange={handleImportConfig}
              />
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportConfig}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddConfig}
            >
              Add Configuration
            </Button>
          </Box>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <List>
          {configs.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No language configurations found. Add a new configuration using the button above.
              </Typography>
            </Paper>
          ) : (
            configs.map((config) => (
              <Paper key={config.id} elevation={1} sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary={config.name}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          File Extension: {config.fileExtension}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          {config.description}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEditConfig(config)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteConfig(config.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))
          )}
        </List>
      </Paper>

      {/* New Configuration Dialog */}
      <Dialog open={newConfigOpen} onClose={() => setNewConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Configuration Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="File Extension"
                value={formData.fileExtension}
                onChange={(e) => setFormData({ ...formData, fileExtension: e.target.value })}
                fullWidth
                required
                placeholder=".c, .cpp, .java, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Compiler Path"
                value={formData.compiler}
                onChange={(e) => setFormData({ ...formData, compiler: e.target.value })}
                fullWidth
                placeholder="/usr/bin/gcc, javac, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Compiler Arguments"
                value={formData.compilerArgs}
                onChange={(e) => setFormData({ ...formData, compilerArgs: e.target.value })}
                fullWidth
                placeholder="-o {output} {input}"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Run Command"
                value={formData.runCommand}
                onChange={(e) => setFormData({ ...formData, runCommand: e.target.value })}
                fullWidth
                placeholder="./{output}, java -cp {directory} {classname}, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Run Arguments"
                value={formData.runArgs}
                onChange={(e) => setFormData({ ...formData, runArgs: e.target.value })}
                fullWidth
                placeholder="Default arguments (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConfigOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNewConfig} variant="contained" color="primary">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Configuration Dialog */}
      <Dialog open={editConfigOpen} onClose={() => setEditConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Configuration Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="File Extension"
                value={formData.fileExtension}
                onChange={(e) => setFormData({ ...formData, fileExtension: e.target.value })}
                fullWidth
                required
                placeholder=".c, .cpp, .java, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Compiler Path"
                value={formData.compiler}
                onChange={(e) => setFormData({ ...formData, compiler: e.target.value })}
                fullWidth
                placeholder="/usr/bin/gcc, javac, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Compiler Arguments"
                value={formData.compilerArgs}
                onChange={(e) => setFormData({ ...formData, compilerArgs: e.target.value })}
                fullWidth
                placeholder="-o {output} {input}"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Run Command"
                value={formData.runCommand}
                onChange={(e) => setFormData({ ...formData, runCommand: e.target.value })}
                fullWidth
                placeholder="./{output}, java -cp {directory} {classname}, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Run Arguments"
                value={formData.runArgs}
                onChange={(e) => setFormData({ ...formData, runArgs: e.target.value })}
                fullWidth
                placeholder="Default arguments (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditConfigOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateConfig} variant="contained" color="primary">
            Update Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Snackbar */}
      <Snackbar
        open={importSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setImportSnackbarOpen(false)}
        message="Configurations imported successfully"
      />

      {/* Export Snackbar */}
      <Snackbar
        open={exportSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setExportSnackbarOpen(false)}
        message="Configurations exported successfully"
      />
    </Box>
  );
};

export default LanguageConfiguration;