import React, { useState } from 'react';
import { 
  Paper, Typography, Box, Divider, Chip, 
  TextField, Button, 
  Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, Alert, CircularProgress
} from '@mui/material';
import { 
  CalendarToday as CalendarTodayIcon,
  Percent as PercentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { updateAssignment, deleteAssignment } from '../services/api';

interface AssignmentType {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

interface AssignmentDetailsProps {
  assignment: AssignmentType;
  onAssignmentUpdate?: () => void;
  onAssignmentDelete?: () => void;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ 
  assignment, 
  onAssignmentUpdate, 
  onAssignmentDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState<AssignmentType>({...assignment});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

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
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
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

      {/* Main Content */}
      <Paper sx={{ p: 4, borderRadius: 1 }}>
        {/* Header */}
        {isEditing ? (
          <TextField
            fullWidth
            label="Assignment Name"
            value={editedAssignment.assignment_name}
            onChange={(e) => handleChange('assignment_name', e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        ) : (
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
            {assignment.assignment_name}
          </Typography>
        )}

        {/* Info Chips */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {isEditing ? (
            <>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={new Date(editedAssignment.assignment_date)}
                  onChange={(newValue) => {
                    if (newValue) {
                      handleChange('assignment_date', newValue.toISOString().split('T')[0]);
                    }
                  }}
                  slotProps={{ textField: { variant: 'outlined', size: 'small' } }}
                />
              </LocalizationProvider>
              
              <TextField
                label="Grade %"
                type="number"
                value={editedAssignment.assignment_percent}
                onChange={(e) => handleChange('assignment_percent', parseFloat(e.target.value))}
                variant="outlined"
                size="small"
              />
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
              rows={4}  // Increased from 2 to 4 rows for better editing
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
                maxHeight: '200px'  // Added max height with scrolling like expected output
              }}
            >
              {assignment.args && assignment.args.trim() !== '' ? assignment.args : 'None specified'}
            </Paper>
          )}
        </Box>

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