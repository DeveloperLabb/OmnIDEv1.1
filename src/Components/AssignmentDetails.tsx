import React, { useState } from 'react';
import { 
  Paper, Typography, Box, Divider, Chip, 
  TextField, Button, 
  Dialog, DialogActions, DialogContent, DialogTitle
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
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState<AssignmentType>({...assignment});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
  };

  const saveChanges = () => {
    console.log('Saving assignment:', editedAssignment);
    setIsEditing(false);
    alert('Assignment updated successfully!');
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
        {isEditing ? (
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
                      handleChange('assignment_date', newValue.toISOString());
                    }
                  }}
                  slotProps={{ textField: { variant: 'outlined', size: 'small' } }}
                />
              </LocalizationProvider>
              
              <TextField
                label="Grade %"
                type="number"
                value={editedAssignment.assignment_percent}
                onChange={(e) => handleChange('assignment_percent', parseInt(e.target.value))}
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
              rows={2}
              value={editedAssignment.args || ''}
              onChange={(e) => handleChange('args', e.target.value)}
              placeholder="Command line arguments (if any)"
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          ) : (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                fontFamily: 'monospace', 
                bgcolor: 'grey.50',
                whiteSpace: 'pre-wrap' 
              }}
            >
              {assignment.args || 'None specified'}
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
              sx={{ fontFamily: 'monospace' }}
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
          <Button color="error" onClick={() => {
            setDeleteDialogOpen(false);
          }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentDetails;