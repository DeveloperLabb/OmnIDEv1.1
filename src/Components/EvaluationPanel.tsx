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
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleEvaluate = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const data = await evaluateSubmissions({
        assignment_no: selectedAssignment || undefined
      });
      setResults(data);
      showSnackbar('Evaluation completed successfully', 'success');
    } catch (err) {
      showSnackbar('Evaluation process failed', 'error');
    } finally {
      setLoading(false);
    }
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
