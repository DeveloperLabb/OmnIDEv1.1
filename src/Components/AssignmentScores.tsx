import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Container,
  Divider,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import GradeIcon from '@mui/icons-material/Grade';
import { getAssignmentScores } from '../services/api';

interface Student {
  student_id: number;
  score: number;
}

interface AssignmentScore {
  assignment_no: number;
  assignment_name: string;
  student_count: number;
  average_score: number;
  students: Student[];
}

const AssignmentScores: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<AssignmentScore[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAssignmentScores();
      setScores(data);
    } catch (err) {
      console.error('Failed to load scores:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching scores');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (scores.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No assignment scores available. Please create assignments and evaluate student submissions first.
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 2, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom mb={3}>
          Assignment Scores
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {scores.map((assignmentScore) => (
          <Accordion key={assignmentScore.assignment_no} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
                  {assignmentScore.assignment_name || `Assignment #${assignmentScore.assignment_no}`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: { xs: 1, sm: 0 } }}>
                  <Chip 
                    icon={<PersonIcon />} 
                    label={`${assignmentScore.student_count} Students`} 
                    color="primary" 
                    size="small"
                  />
                  <Chip 
                    icon={<GradeIcon />} 
                    label={`Avg: ${assignmentScore.average_score.toFixed(2)}%`} 
                    color="secondary"
                    size="small" 
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell align="right">Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignmentScore.students.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell component="th" scope="row">
                          {student.student_id}
                        </TableCell>
                        <TableCell align="right">
                          {student.score}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Container>
  );
};

export default AssignmentScores;