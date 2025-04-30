import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

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

const API_BASE_URL = 'http://localhost:8000/api';

const AssignmentModal: React.FC<AssignmentModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<AssignmentData>({
    assignment_name: '',
    assignment_date: new Date().toISOString().split('T')[0],
    assignment_percent: 0,
    correct_output: ''
  });
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const [remainingPercentage, setRemainingPercentage] = useState(100);
  const [loading, setLoading] = useState(false);

  // Fetch all assignments when modal opens to calculate remaining percentage
  useEffect(() => {
    if (open) {
      fetchAssignments();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation
    if (formData.assignment_percent > remainingPercentage) {
      showSnackbar(`Assignment percentage exceeds available ${remainingPercentage}%`, 'error');
      return;
    }
    
    try {
      onSubmit(formData);
      showSnackbar(`Assignment "${formData.assignment_name}" saved successfully`, 'success');
      resetForm();
    } catch (error) {
      console.error('Error saving assignment:', error);
      showSnackbar('Failed to save assignment', 'error');
    }
  };

  const handlePercentageChange = (_event: Event, newValue: number | number[]) => {
    const value = Math.min(newValue as number, remainingPercentage);
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
      correct_output: ''
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
                        : `${formData.assignment_percent}% (${remainingPercentage}% remaining)`}
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
                      { value: remainingPercentage, label: `${remainingPercentage}%` }
                    ]}
                    disabled={remainingPercentage === 0}
                    min={0}
                    max={remainingPercentage}
                  />
                </Box>

                <TextField
                  label="Correct Output"
                  value={formData.correct_output}
                  onChange={(e) => setFormData({ ...formData, correct_output: e.target.value })}
                  required
                  fullWidth
                  multiline
                  rows={4}
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
              disabled={loading || remainingPercentage === 0}
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
