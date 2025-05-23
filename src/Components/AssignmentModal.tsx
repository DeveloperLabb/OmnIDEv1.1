import React, { useState, useEffect, useRef } from 'react';

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      selectFile: (options: { filters: { name: string; extensions: string[] }[] }) => Promise<string | undefined>;
      selectDirectory: () => Promise<string | undefined>;
    };
  }
}
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Box,
  Snackbar,
  Alert,
  Slider,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import { createConfiguration, getAllConfigurations, executeInstructorFile } from '../services/api';

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssignmentData) => void;
}

interface AssignmentData {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
  instructor_zip_path?: string;
  student_submissions_path?: string;
}

interface AssignmentType {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
}

interface SnackbarMessage {
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// For better type safety with Electron File API
interface ElectronFile extends File {
  path: string;
}

interface Configuration {
  config_id: number;
  language_name: string;
  path: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

const AssignmentModal: React.FC<AssignmentModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<AssignmentData>({
    assignment_name: '',
    assignment_date: new Date().toISOString().split('T')[0],
    assignment_percent: 0,
    correct_output: '',
    args: '',
    instructor_zip_path: '',
    student_submissions_path: ''
  });
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const [remainingPercentage, setRemainingPercentage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [executingFile, setExecutingFile] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [detectedConfigPath, setDetectedConfigPath] = useState<string | null>(null);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // References for the hidden file inputs
  const instructorZipInputRef = useRef<HTMLInputElement>(null);
  const studentFolderInputRef = useRef<HTMLInputElement>(null);

  // Check form validity whenever formData changes
  useEffect(() => {
    const requiredFields = [
      formData.assignment_name,
      formData.correct_output
    ];
    
    // Check if all required fields are filled and assignment percent is > 0
    const valid = requiredFields.every(field => field && field.trim() !== '') && 
                 formData.assignment_percent > 0;
    
    setIsFormValid(valid);
  }, [formData]);

  // Fetch all assignments when modal opens
  useEffect(() => {
    if (open) {
      fetchAssignments();
      fetchConfigurations();
      resetForm();
    }
  }, [open]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/`);
      if (response.ok) {
        const assignments: AssignmentType[] = await response.json();
        
        // Calculate total percentage already allocated
        const totalAllocated = assignments.reduce(
          (sum, assignment) => sum + assignment.assignment_percent, 
          0
        );
        
        // Calculate remaining percentage
        const remaining = Math.max(0, 100 - totalAllocated);
        setRemainingPercentage(remaining);
        
        // Set default percentage to either the remaining amount or 0
        setFormData(prev => ({
          ...prev,
          assignment_percent: Math.min(prev.assignment_percent, remaining)
        }));
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showSnackbar('Failed to calculate remaining percentage', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      const configs = await getAllConfigurations();
      setConfigurations(configs);
    } catch (error) {
      console.error('Failed to load configurations:', error);
      showSnackbar('Failed to load language configurations', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation
    if (formData.assignment_percent > remainingPercentage) {
      showSnackbar(`Assignment percentage exceeds available ${remainingPercentage}%`, 'error');
      return;
    }

    // Validate paths if provided
    if ((formData.instructor_zip_path && !formData.instructor_zip_path.endsWith('.zip'))) {
      showSnackbar('Please provide a valid ZIP file for instructor file', 'error');
      return;
    }
    
    if (formData.student_submissions_path && !formData.student_submissions_path) {
      showSnackbar('Please provide a valid path for student submissions', 'error');
      return;
    }
    
    try {
      setLoading(true);
      // First create the assignment
      const result = await onSubmit(formData) as unknown as { assignment_no: number };
      
      // If paths are provided, extract the ZIP files
      if (formData.instructor_zip_path || formData.student_submissions_path) {
        await extractZipFiles(result.assignment_no, formData.assignment_name);
        showSnackbar(`Assignment "${formData.assignment_name}" saved with files extracted successfully`, 'success');
      } else {
        showSnackbar(`Assignment "${formData.assignment_name}" saved successfully`, 'success');
      }
      
      resetForm();
      
      // Close the modal after successful submission
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error saving assignment:', error);
      showSnackbar('Failed to save assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const extractZipFiles = async (assignmentNo: number, assignmentName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentNo}/extract-zip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructor_zip_path: formData.instructor_zip_path || '',
          student_submissions_path: formData.student_submissions_path || '',
          assignment_name: assignmentName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to extract ZIP files');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error extracting ZIP files:', error);
      throw error;
    }
  };
  
  // Execute instructor file and set output as expected output
  const executeInstructorFileAndGetOutput = async () => {
    // Check if instructor path is valid
    if (!formData.instructor_zip_path || !formData.instructor_zip_path.endsWith('.zip')) {
      showSnackbar('Please select a valid instructor ZIP file first', 'error');
      return;
    }
    
    setExecutingFile(true);
    
    try {
      // Call the API endpoint for executing the instructor file
      const result = await executeInstructorFile(formData.instructor_zip_path, formData.args || '');
      
      // Set the output as the expected output
      setFormData({
        ...formData,
        correct_output: result.output
      });

      // Handle detected language and config
      if (result.detected_language) {
        setDetectedLanguage(result.detected_language);
        setDetectedConfigPath(result.config_path || '');
        
        // Refresh configurations to ensure we have the latest data
        await fetchConfigurations();
        
        // Find and select the config if it exists
        if (result.config_path) {
          const matchingConfig = configurations.find(
            c => c.language_name === result.detected_language && c.path === result.config_path
          );
          if (matchingConfig) {
            setSelectedConfig(matchingConfig.config_id);
          }
        }
        
        // Show the config panel
        setShowConfigPanel(true);
      }
      
      showSnackbar('Instructor file executed successfully. Expected output updated.', 'success');
    } catch (error) {
      console.error('Error executing instructor file:', error);
      showSnackbar('Failed to execute instructor file: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setExecutingFile(false);
    }
  };

  const handleChangeConfig = async (configId: number) => {
    setSelectedConfig(configId);
    const selectedConf = configurations.find(c => c.config_id === configId);
    if (selectedConf) {
      setDetectedConfigPath(selectedConf.path);
    }
  };

  const handleSaveNewConfig = async () => {
    if (!detectedLanguage || !detectedConfigPath) {
      showSnackbar('Missing language or path information', 'error');
      return;
    }

    try {
      // Check if this path already exists for this language
      const existingConfig = configurations.find(
        c => c.language_name === detectedLanguage && c.path === detectedConfigPath
      );

      if (existingConfig) {
        // If configuration already exists, just select it
        setSelectedConfig(existingConfig.config_id);
        showSnackbar('Configuration already exists', 'info');
        return;
      }

      // Create new configuration
      const result = await createConfiguration({
        language_name: detectedLanguage,
        path: detectedConfigPath
      });

      // Refresh configurations and select the new one
      await fetchConfigurations();
      setSelectedConfig(result.config_id);
      showSnackbar('Configuration saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showSnackbar('Failed to save configuration', 'error');
    }
  };

  const handlePercentageChange = (_event: Event, newValue: number | number[]) => {
    // Ensure the value doesn't exceed 100%
    const maxAllowed = Math.min(100, remainingPercentage);
    const value = Math.min(newValue as number, maxAllowed);
    setFormData({
      ...formData,
      assignment_percent: value
    });
  };

  const resetForm = () => {
    setFormData({
      assignment_name: '',
      assignment_date: new Date().toISOString().split('T')[0],
      assignment_percent: 0,
      correct_output: '',
      args: '',
      instructor_zip_path: '',
      student_submissions_path: ''
    });
  };

  // Show snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  // File dialog handlers using Electron API
  const handleInstructorZipBrowse = async () => {
    if (window.electronAPI) {
      const filePath = await window.electronAPI.selectFile({
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
      });

      if (filePath) {
        setFormData({
          ...formData,
          instructor_zip_path: filePath
        });
      }
    } else {
      // Fallback for non-Electron environments
      if (instructorZipInputRef.current) {
        instructorZipInputRef.current.click();
      }
    }
  };

  const handleStudentFolderBrowse = async () => {
    // Only enable student folder selection if instructor file is provided
    if (!formData.instructor_zip_path) {
      showSnackbar('Please select instructor file first', 'info');
      return;
    }

    if (window.electronAPI) {
      const folderPath = await window.electronAPI.selectDirectory();

      if (folderPath) {
        setFormData({
          ...formData,
          student_submissions_path: folderPath
        });
      }
    } else {
      // Fallback for non-Electron environments
      if (studentFolderInputRef.current) {
        studentFolderInputRef.current.click();
      }
    }
  };

  const handleInstructorZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0] as ElectronFile;
      setFormData({
        ...formData,
        instructor_zip_path: file.path || e.target.value
      });
    }
  };

  const handleStudentFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0] as ElectronFile;
      setFormData({
        ...formData,
        student_submissions_path: file.path || e.target.value
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Assignment</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Assignment Name"
                  value={formData.assignment_name}
                  onChange={(e) => setFormData({ ...formData, assignment_name: e.target.value })}
                  required
                  fullWidth
                />

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Assignment Date"
                    value={new Date(formData.assignment_date)}
                    onChange={(newDate) => {
                      if (newDate) {
                        setFormData({
                          ...formData,
                          assignment_date: newDate.toISOString().split('T')[0]
                        });
                      }
                    }}
                  />
                </LocalizationProvider>

                {/* Assignment Percentage with remaining info */}
                <Box sx={{ mt: 3, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography id="assignment-percentage-slider" gutterBottom>
                      Assignment Percentage
                    </Typography>
                    <Typography
                      variant="body2"
                      color={remainingPercentage > 0 ? "text.secondary" : "error"}>
                      {remainingPercentage === 0
                        ? "No percentage remaining"
                        : `${formData.assignment_percent}% (${Math.min(100, remainingPercentage)}% remaining)`}
                    </Typography>
                  </Box>
                  <Slider
                    value={formData.assignment_percent}
                    onChange={handlePercentageChange}
                    aria-labelledby="assignment-percentage-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: Math.min(25, remainingPercentage), label: `${Math.min(25, remainingPercentage)}%` },
                      { value: Math.min(50, remainingPercentage), label: remainingPercentage >= 50 ? '50%' : '' },
                      { value: Math.min(75, remainingPercentage), label: remainingPercentage >= 75 ? '75%' : '' },
                      { value: Math.min(100, remainingPercentage), label: `${Math.min(100, remainingPercentage)}%` }
                    ]}
                    disabled={remainingPercentage === 0}
                    min={0}
                    max={Math.min(100, remainingPercentage)}
                  />
                </Box>

                {/* Add Arguments field */}
                <TextField
                  label="Arguments"
                  value={formData.args || ''}
                  onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Command line arguments (if any)"
                  helperText="Optional: Enter arguments to be passed to the program"
                />

                {/* Instructor ZIP file path field */}
                <Box>
                  <TextField
                    label="Instructor ZIP File"
                    value={formData.instructor_zip_path || ''}
                    onChange={(e) => setFormData({ ...formData, instructor_zip_path: e.target.value })}
                    fullWidth
                    placeholder="Path to instructor's ZIP file"
                    helperText="Select the instructor's ZIP file containing reference solution"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Browse for instructor ZIP file">
                            <IconButton onClick={handleInstructorZipBrowse} edge="end">
                              <FolderOpenIcon />
                            </IconButton>
                          </Tooltip>
                          {/* Fixed: Added span wrapper around disabled button */}
                          <Tooltip title="Run instructor file to get expected output">
                            <span> {/* This wrapper allows tooltip to work even when button is disabled */}
                              <IconButton
                                onClick={executeInstructorFileAndGetOutput}
                                edge="end"
                                color="primary"
                                disabled={!formData.instructor_zip_path || executingFile}
                              >
                                {executingFile ? <CircularProgress size={24} /> : <PlayArrowIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <input
                    type="file"
                    accept=".zip"
                    ref={instructorZipInputRef}
                    style={{ display: 'none' }}
                    onChange={handleInstructorZipChange}
                  />
                </Box>

                {/* Detected Language Config Panel */}
                {showConfigPanel && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detected Language: <strong>{detectedLanguage}</strong>
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      {/* Select existing configuration */}
                      <FormControl size="small" fullWidth>
                        <InputLabel id="config-select-label">Configuration</InputLabel>
                        <Select
                          labelId="config-select-label"
                          value={selectedConfig || ''}
                          label="Configuration"
                          onChange={(e) => handleChangeConfig(e.target.value as number)}
                        >
                          <MenuItem value="">
                            <em>Select a configuration</em>
                          </MenuItem>
                          {configurations
                            .filter(config => config.language_name === detectedLanguage)
                            .map(config => (
                              <MenuItem key={config.config_id} value={config.config_id}>
                                {config.path}
                              </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Choose a saved configuration</FormHelperText>
                      </FormControl>

                      {/* Edit or create new configuration */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                          label="Configuration Path"
                          size="small"
                          fullWidth
                          value={detectedConfigPath || ''}
                          onChange={(e) => setDetectedConfigPath(e.target.value)}
                          placeholder="Path to compiler/interpreter"
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleSaveNewConfig}
                          disabled={!detectedLanguage || !detectedConfigPath}
                        >
                          Save
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                )}

                {/* Student submissions folder path field - enabled only after instructor file is set */}
                <TextField
                  label="Student Submissions Folder"
                  value={formData.student_submissions_path || ''}
                  onChange={(e) => setFormData({ ...formData, student_submissions_path: e.target.value })}
                  fullWidth
                  disabled={!formData.instructor_zip_path}
                  placeholder="Path to folder with student ZIP submissions"
                  helperText={formData.instructor_zip_path
                    ? "Select the folder containing student ZIP submissions"
                    : "Please select instructor file first"
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {/* Fixed: Added tooltip and span wrapper around disabled button */}
                        <Tooltip title="Browse for student submissions folder">
                          <span> {/* This wrapper allows tooltip to work even when button is disabled */}
                            <IconButton
                              onClick={handleStudentFolderBrowse}
                              edge="end"
                              disabled={!formData.instructor_zip_path}
                            >
                              <FolderOpenIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <input
                  type="file"
                  data-webkitdirectory="true"
                  data-directory=""
                  ref={studentFolderInputRef}
                  style={{ display: 'none' }}
                  onChange={handleStudentFolderChange}
                />

                {/* Expected Output Field */}
                <TextField
                  label="Expected Output"
                  value={formData.correct_output}
                  onChange={(e) => setFormData({ ...formData, correct_output: e.target.value })}
                  required
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Expected output from the student programs"
                  helperText="This will be compared with student program outputs for evaluation"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || remainingPercentage === 0 || !isFormValid}
              startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
            >
              Add Assignment
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

export default AssignmentModal;