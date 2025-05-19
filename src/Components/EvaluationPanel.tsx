import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Paper, 
  Typography, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  Container
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { evaluateSubmissions } from '../services/api';

interface Assignment {
  assignment_no: number;
  assignment_name: string;
}

interface EvaluationResult {
  student_id: number;
  assignment_no: number;
  assignment_name?: string;
  score: number;
  matched: boolean;
  student_output?: string;
  expected_output?: string;
}

interface EvaluationPanelProps {
  assignments: Assignment[];
  refreshAssignments: () => void;
}

const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ assignments, refreshAssignments }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleEvaluate = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // If specific assignment is selected, check if it has submission files
      if (selectedAssignment) {
        // Get the selected assignment
        const assignment = assignments.find(a => a.assignment_no === selectedAssignment);
        
        // If we found the assignment, check if its folder exists in defaultExtractLocation
        if (assignment) {
          // Verify if the submission folder exists
          const folderCheckResponse = await fetch(`http://localhost:8000/api/assignments/${selectedAssignment}/student-submissions`);
          const folderData = await folderCheckResponse.json();
          
          if (!folderData.students || folderData.students.length === 0) {
            const assignmentName = assignment.assignment_name || `Assignment #${assignment.assignment_no}`;
            showSnackbar(`No submission files found for "${assignmentName}". Please add student submissions folder for this assignment first.`, 'error');
            setLoading(false);
            return;
          }
        }
      } else {
        // For "All Assignments" option, check each assignment and collect errors
        const missingSubmissions: string[] = [];
        
        // Check each assignment for submission files
        for (const assignment of assignments) {
          try {
            const folderCheckResponse = await fetch(`http://localhost:8000/api/assignments/${assignment.assignment_no}/student-submissions`);
            const folderData = await folderCheckResponse.json();
            
            if (!folderData.students || folderData.students.length === 0) {
              const assignmentName = assignment.assignment_name || `Assignment #${assignment.assignment_no}`;
              missingSubmissions.push(assignmentName);
            }
          } catch (error) {
            const assignmentName = assignment.assignment_name || `Assignment #${assignment.assignment_no}`;
            missingSubmissions.push(assignmentName);
          }
        }
        
        // If there are assignments with missing submissions, show warning
        if (missingSubmissions.length > 0) {
          showSnackbar(
            `Warning: The following assignments have no submission files: ${missingSubmissions.join(', ')}. Only assignments with submissions will be evaluated.`, 
            'warning'
          );
        }
      }

      // Continue with evaluation if checks pass
      const data = await evaluateSubmissions({
        assignment_no: selectedAssignment || undefined
      });
      
      if (data.length > 0) {
        setResults(data);
        showSnackbar('Evaluation completed successfully', 'success');
      } else {
        showSnackbar('No submissions were evaluated. Make sure your assignments have student submissions folders.', 'warning');
      }
    } catch (err) {
      // Check if the error is about missing files
      if (err instanceof Error && err.message.includes('No student submissions found')) {
        const assignmentName = selectedAssignment ? 
          (assignments.find(a => a.assignment_no === selectedAssignment)?.assignment_name || `Assignment #${selectedAssignment}`) : 
          'selected assignment';
        
        showSnackbar(`No submission files found for "${assignmentName}". Please add student submissions folder for this assignment first in the assignment edit section.`, 'error');
      } else {
        showSnackbar('Evaluation process failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAssignmentChange = (event: SelectChangeEvent<number | string>) => {
    const value = event.target.value;
    setSelectedAssignment(value === "" ? null : Number(value));
  };
  
  return (
    <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Paper 
        sx={{ 
          p: 3, 
          my: 2,
          width: '100%',
          minWidth: { xs: '300px', sm: '500px' },
          maxWidth: '900px',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Evaluate Student Submissions
        </Typography>
        
        <Box sx={{ my: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
            <FormControl fullWidth>
              <InputLabel>Select Assignment</InputLabel>
              <Select
                value={selectedAssignment || ''}
                label="Select Assignment"
                onChange={handleAssignmentChange}
              >
                <MenuItem value="">All Assignments</MenuItem>
                {assignments.map((assignment) => (
                  <MenuItem key={assignment.assignment_no} value={assignment.assignment_no}>
                    {assignment.assignment_name || `Assignment #${assignment.assignment_no}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleEvaluate}
            disabled={loading || assignments.length === 0}
          >
            {loading ? 'Evaluating...' : 'Run Evaluation'}
          </Button>
        </Box>
        
        {results.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Evaluation Results
            </Typography>
            <TableContainer sx={{ maxHeight: '400px', overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Assignment</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.student_id}</TableCell>
                      <TableCell>
                        {result.assignment_name || `Assignment #${result.assignment_no}`}
                      </TableCell>
                      <TableCell>{result.score}</TableCell>
                      <TableCell>
                        {result.matched ? (
                          <Alert severity="success" sx={{ display: 'inline-flex' }}>
                            Match
                          </Alert>
                        ) : (
                          <Alert severity="error" sx={{ display: 'inline-flex' }}>
                            No Match
                          </Alert>
                        )}
                      </TableCell>
                      <TableCell>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Output Details</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="subtitle2">Expected Output:</Typography>
                            <Paper elevation={1} sx={{ p: 1, mb: 2, bgcolor: 'background.default' }}>
                              <code>{result.expected_output}</code>
                            </Paper>
                            
                            <Typography variant="subtitle2">Student Output:</Typography>
                            <Paper elevation={1} sx={{ p: 1, bgcolor: 'background.default' }}>
                              <code>{result.student_output}</code>
                            </Paper>
                          </AccordionDetails>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default EvaluationPanel;
