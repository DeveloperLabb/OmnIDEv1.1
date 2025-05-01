import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getAllAssignments, getAssignment } from '../services/api';
import AssignmentModal from './AssignmentModal';

interface Assignment {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

const AssignmentsList: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewOutputDialogOpen, setViewOutputDialogOpen] = useState(false);

  // Fetch all assignments when component mounts
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAssignments();
      setAssignments(data);
    } catch (error) {
      setError('Failed to fetch assignments. Please try again later.');
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedAssignment(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitAssignment = async (data: any) => {
    // After successful assignment creation, refresh the list
    await fetchAssignments();
    handleCloseModal();
  };

  const handleViewOutput = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setViewOutputDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">All Assignments</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Add Assignment
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : assignments.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No assignments found. Create your first assignment using the button above.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Percentage</TableCell>
                <TableCell>Arguments</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.assignment_no}>
                  <TableCell>{assignment.assignment_no}</TableCell>
                  <TableCell>{assignment.assignment_name}</TableCell>
                  <TableCell>{formatDate(assignment.assignment_date)}</TableCell>
                  <TableCell>{assignment.assignment_percent}%</TableCell>
                  <TableCell>{assignment.args || 'None'}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleViewOutput(assignment)}
                    >
                      View Output
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AssignmentModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAssignment}
      />

      {/* Dialog to view the correct output */}
      <Dialog
        open={viewOutputDialogOpen}
        onClose={() => setViewOutputDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Expected Output for {selectedAssignment?.assignment_name}
        </DialogTitle>
        <DialogContent>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5', 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              mt: 2
            }}
          >
            {selectedAssignment?.correct_output || 'No output specified'}
          </Paper>
          
          {selectedAssignment?.args && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Command Line Arguments:
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  fontFamily: 'monospace'
                }}
              >
                {selectedAssignment.args}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOutputDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentsList;