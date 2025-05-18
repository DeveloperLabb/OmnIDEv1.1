import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Typography, Box, Divider, Chip,
  TextField, Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, Alert, CircularProgress,
  InputAdornment, IconButton, Tooltip,
  Slider, FormControl, InputLabel, Select, MenuItem, FormHelperText,
  LinearProgress
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Percent as PercentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteOutline as DeleteIcon,
  FolderOpen as FolderOpenIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { updateAssignment, deleteAssignment, executeInstructorFile, createConfiguration, getAllConfigurations } from '../services/api';

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      selectFile: (options: { filters: { name: string; extensions: string[] }[] }) => Promise<string | undefined>;
      selectDirectory: () => Promise<string | undefined>;
    };
  }
}

interface AssignmentType {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
  instructor_zip_path?: string;
  student_submissions_path?: string;
}

interface AssignmentDetailsProps {
  assignment: AssignmentType;
  onAssignmentUpdate?: () => void;
  onAssignmentDelete?: () => void;
}

interface Configuration {
  config_id: number;
  language_name: string;
  path: string;
}

// For better type safety with Electron File API
interface ElectronFile extends File {
  path: string;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  assignment,
  onAssignmentUpdate,
  onAssignmentDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState<AssignmentType>({...assignment});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [executingFile, setExecutingFile] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [remainingPercentage, setRemainingPercentage] = useState(100);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [detectedConfigPath, setDetectedConfigPath] = useState<string | null>(null);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References for the hidden file inputs
  const instructorZipInputRef = useRef<HTMLInputElement>(null);
  const studentFolderInputRef = useRef<HTMLInputElement>(null);

  // Initialize edit assignment state from props with safety timeout
  useEffect(() => {
    console.log("Assignment details initializing with assignment:", assignment.assignment_name);

    // Set loading state
    setLoading(true);
    setLoadError(null);

    // Set a fallback timeout in case something goes wrong
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.log("Loading fallback triggered");
        setLoading(false);
      }
    }, 3000);

    // Load assignment data with a short timeout to ensure UI updates
    const timer = setTimeout(() => {
      try {
        setEditedAssignment({...assignment});
        setLoading(false);
        console.log("Assignment details loaded successfully");
      } catch (error) {
        console.error("Error initializing assignment details:", error);
        setLoadError("Error loading assignment details");
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [assignment]); // Only run when assignment changes

  // Fetch assignments to calculate remaining percentage and configurations
  useEffect(() => {
    if (isEditing) {
      fetchAssignments();
      fetchConfigurations();
    }
  }, [isEditing]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/assignments/`);
      if (response.ok) {
        const assignments: AssignmentType[] = await response.json();

        // Calculate total percentage already allocated
        const totalAllocated = assignments.reduce(
          (sum, a) => sum + (a.assignment_no === assignment.assignment_no ? 0 : a.assignment_percent),
          0
        );

        // Calculate remaining percentage - ensure it's capped at 100%
        const remaining = Math.min(100, Math.max(0, 100 - totalAllocated));
        setRemainingPercentage(remaining + (editedAssignment.assignment_percent || 0));
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showSnackbar('Failed to calculate remaining percentage', 'error');
    }
  };

  const fetchConfigurations = async () => {
    try {
      const configs = await getAllConfigurations();
      setConfigurations(configs);

      // If we have instructor path and the config panel isn't shown yet, try to detect configuration
      if (editedAssignment.instructor_zip_path && !showConfigPanel) {
        detectLanguageAndConfig();
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
      showSnackbar('Failed to load language configurations', 'error');
    }
  };

  const detectLanguageAndConfig = async () => {
    if (!editedAssignment.instructor_zip_path) return;

    // This would be a call to backend to detect language based on the instructor file
    // For now, we'll just set a placeholder
    if (configurations.length > 0) {
      const firstConfig = configurations[0];
      setDetectedLanguage(firstConfig.language_name);
      setDetectedConfigPath(firstConfig.path);
      setSelectedConfig(firstConfig.config_id);
      setShowConfigPanel(true);
    }
  };

  const handleChange = (field: keyof AssignmentType, value: any) => {
    setEditedAssignment({
      ...editedAssignment,
      [field]: value
    });
  };

  const startEditing = () => {
    setEditedAssignment({...assignment});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedAssignment({...assignment});
    setShowConfigPanel(false);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      // Format date if needed
      const formattedData = {
        ...editedAssignment,
        assignment_date: new Date(editedAssignment.assignment_date).toISOString().split('T')[0],
        assignment_percent: Number(editedAssignment.assignment_percent)
      };

      await updateAssignment(assignment.assignment_no, formattedData);
      setIsEditing(false);
      setShowConfigPanel(false);
      showSnackbar('Assignment updated successfully!', 'success');

      // Trigger refresh in parent component
      if (onAssignmentUpdate) {
        onAssignmentUpdate();
      }
    } catch (error) {
      console.error('Failed to update assignment:', error);
      showSnackbar(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setLoading(true);
    try {
      await deleteAssignment(assignment.assignment_no);
      showSnackbar('Assignment deleted successfully!', 'success');

      // Notify parent component of the deletion after a small delay to show the success message
      if (onAssignmentDelete) {
        setTimeout(() => {
          onAssignmentDelete();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      showSnackbar(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log("Retrying assignment load");
    setLoading(true);
    setLoadError(null);

    // Retry loading the assignment with a timeout
    setTimeout(() => {
      try {
        setEditedAssignment({...assignment});
        setLoading(false);
      } catch (error) {
        console.error("Error retrying assignment load:", error);
        setLoadError("Error loading assignment details");
        setLoading(false);
      }
    }, 300);
  };

  // Execute instructor file and set output as expected output
  const executeInstructorFileAndGetOutput = async () => {
    // Check if instructor path is valid
    if (!editedAssignment.instructor_zip_path || !editedAssignment.instructor_zip_path.endsWith('.zip')) {
      showSnackbar('Please select a valid instructor ZIP file first', 'error');
      return;
    }

    setExecutingFile(true);

    try {
      // Call the API endpoint for executing the instructor file
      const result = await executeInstructorFile(editedAssignment.instructor_zip_path, editedAssignment.args || '');

      // Set the output as the expected output
      setEditedAssignment({
        ...editedAssignment,
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
    handleChange('assignment_percent', value);
  };

  // File dialog handlers using Electron API
  const handleInstructorZipBrowse = async () => {
    if (window.electronAPI) {
      const filePath = await window.electronAPI.selectFile({
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
      });

      if (filePath) {
        handleChange('instructor_zip_path', filePath);
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
    if (!editedAssignment.instructor_zip_path) {
      showSnackbar('Please select instructor file first', 'info');
      return;
    }

    if (window.electronAPI) {
      const folderPath = await window.electronAPI.selectDirectory();

      if (folderPath) {
        handleChange('student_submissions_path', folderPath);
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
      handleChange('instructor_zip_path', file.path || e.target.value);
    }
  };

  const handleStudentFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0] as ElectronFile;
      handleChange('student_submissions_path', file.path || e.target.value);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Loading data...
        </Typography>
        <LinearProgress sx={{ maxWidth: 500, mx: 'auto', mt: 2 }} />

        {/* Add a fallback retry button that appears after 5 seconds if still loading */}
        <Box
          sx={{
            mt: 4,
            opacity: 0.8,
            animation: 'fadeIn 1s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 0.8 }
            },
            animationDelay: '5s',
            animationFillMode: 'forwards',
            visibility: 'hidden'
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Taking longer than expected...
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRetry}
            startIcon={<RefreshIcon />}
            sx={{
              mt: 1,
              visibility: 'visible'
            }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  // Show error state with retry button
  if (loadError) {
    return (
      <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {loadError}
        </Typography>
        <Button
          variant="contained"
          onClick={handleRetry}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry Loading
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Action Buttons */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mb: 2,
        gap: 1
      }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : isEditing ? (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveChanges}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={cancelEditing}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={startEditing}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </>
        )}
      </Box>

      {/* Main Content - Using your original component structure */}
      <Paper sx={{ p: 4, borderRadius: 1 }}>
        {/* Header - Assignment name is not editable */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
          {assignment.assignment_name}
        </Typography>

        {/* Info Chips */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {isEditing ? (
            <>
              <Box>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Due Date"
                    value={new Date(editedAssignment.assignment_date)}
                    onChange={(newValue) => {
                      if (newValue) {
                        handleChange('assignment_date', newValue.toISOString().split('T')[0]);
                      }
                    }}
                    slotProps={{ textField: { variant: 'outlined', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>

              {/* Assignment Percentage with remaining info */}
              <Box sx={{ width: '100%', mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography id="assignment-percentage-slider" gutterBottom>
                    Assignment Percentage
                  </Typography>
                  <Typography
                    variant="body2"
                    color={remainingPercentage > 0 ? "text.secondary" : "error"}>
                    {remainingPercentage === 0
                      ? "No percentage remaining"
                      : `${editedAssignment.assignment_percent}% (${Math.min(100, remainingPercentage)}% max)`}
                  </Typography>
                </Box>
                <Slider
                  value={editedAssignment.assignment_percent}
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
            </>
          ) : (
            <>
              <Chip
                icon={<CalendarTodayIcon />}
                label={`Due: ${new Date(assignment.assignment_date).toLocaleDateString()}`}
                variant="outlined"
                color="primary"
              />
              <Chip
                icon={<PercentIcon />}
                label={`${assignment.assignment_percent}% of Grade`}
                color="secondary"
              />
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Assignment Number */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Assignment #{assignment.assignment_no}
        </Typography>

        {/* Arguments */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Arguments
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editedAssignment.args || ''}
              onChange={(e) => handleChange('args', e.target.value)}
              placeholder="Command line arguments (if any)"
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  '& textarea': {
                    overflowY: 'auto',
                    maxHeight: '200px'
                  }
                }
              }}
            />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                fontFamily: 'monospace',
                bgcolor: 'grey.50',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '200px'
              }}
            >
              {assignment.args && assignment.args.trim() !== '' ? assignment.args : 'None specified'}
            </Paper>
          )}
        </Box>

        {/* Instructor ZIP file (only shown in edit mode) */}
        {isEditing && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Instructor ZIP File
            </Typography>
            <TextField
              label="Instructor ZIP File"
              value={editedAssignment.instructor_zip_path || ''}
              onChange={(e) => handleChange('instructor_zip_path', e.target.value)}
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
                    <Tooltip title="Run instructor file to get expected output">
                      <IconButton
                        onClick={executeInstructorFileAndGetOutput}
                        edge="end"
                        color="primary"
                        disabled={!editedAssignment.instructor_zip_path || executingFile}
                      >
                        {executingFile ? <CircularProgress size={24} /> : <PlayArrowIcon />}
                      </IconButton>
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
        )}

        {/* Detected Language Config Panel (only shown in edit mode) */}
        {isEditing && showConfigPanel && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Language Configuration
            </Typography>
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
          </Box>
        )}

        {/* Student submissions folder (only shown in edit mode) */}
        {isEditing && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Student Submissions Folder
            </Typography>
            <TextField
              label="Student Submissions Folder"
              value={editedAssignment.student_submissions_path || ''}
              onChange={(e) => handleChange('student_submissions_path', e.target.value)}
              fullWidth
              disabled={!editedAssignment.instructor_zip_path}
              placeholder="Path to folder with student ZIP submissions"
              helperText={editedAssignment.instructor_zip_path
                ? "Select the folder containing student ZIP submissions"
                : "Please select instructor file first"
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleStudentFolderBrowse}
                      edge="end"
                      disabled={!editedAssignment.instructor_zip_path}
                    >
                      <FolderOpenIcon />
                    </IconButton>
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
          </Box>
        )}

        {/* Expected Output */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Expected Output
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={8}
              value={editedAssignment.correct_output}
              onChange={(e) => handleChange('correct_output', e.target.value)}
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
                '& .MuiOutlinedInput-root': {
                  '& textarea': {
                    overflowY: 'auto',
                    maxHeight: '300px'
                  }
                }
              }}
            />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                fontFamily: 'monospace',
                bgcolor: 'grey.50',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '300px'
              }}
            >
              {assignment.correct_output}
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Assignment?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this assignment? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignmentDetails;