import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Box
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

const AssignmentModal: React.FC<AssignmentModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<AssignmentData>({
    assignment_name: '',
    assignment_date: new Date().toISOString().split('T')[0],
    assignment_percent: 0,
    correct_output: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      assignment_name: '',
      assignment_date: new Date().toISOString().split('T')[0],
      assignment_percent: 0,
      correct_output: ''
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Assignment</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
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

            <TextField
              label="Assignment Percentage"
              type="number"
              value={formData.assignment_percent}
              onChange={(e) => setFormData({ ...formData, assignment_percent: Number(e.target.value) })}
              required
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />

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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Add Assignment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssignmentModal;
