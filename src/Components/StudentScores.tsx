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
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import { getStudentScores } from '../services/api';

interface Assignment {
  assignment_no: number;
  assignment_name: string;
  assignment_percent: number;
  score: number;
}

interface StudentScore {
  student_id: number;
  assignment_count: number;
  average_score: number;
  total_weighted_score: number;
  assignments: Assignment[];
}

const StudentScores: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [filteredScores, setFilteredScores] = useState<StudentScore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchScores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredScores(scores);
    } else {
      setFilteredScores(scores.filter(student => 
        student.student_id.toString().includes(searchQuery)
      ));
    }
  }, [searchQuery, scores]);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStudentScores();
      setScores(data);
      setFilteredScores(data);
    } catch (err) {
      console.error('Failed to load student scores:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching student scores');
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
        No student scores available. Please evaluate student submissions first.
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 2, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom mb={2}>
          Student Scores
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search by Student ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Divider sx={{ mb: 3 }} />
        
        {filteredScores.map((studentScore) => (
          <Accordion key={studentScore.student_id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
                  Student #{studentScore.student_id}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: { xs: 1, sm: 0 }, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<AssignmentIcon />} 
                    label={`${studentScore.assignment_count} Assignments`} 
                    color="primary" 
                    size="small"
                  />
                  <Chip 
                    icon={<GradeIcon />} 
                    label={`Avg: ${studentScore.average_score.toFixed(2)}%`} 
                    size="small" 
                  />
                  <Chip 
                    color="secondary"
                    label={`Total: ${studentScore.total_weighted_score.toFixed(2)}%`} 
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
                      <TableCell>Assignment</TableCell>
                      <TableCell align="right">Weight (%)</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell align="right">Weighted Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentScore.assignments.map((assignment) => (
                      <TableRow key={assignment.assignment_no}>
                        <TableCell component="th" scope="row">
                          {assignment.assignment_name || `Assignment #${assignment.assignment_no}`}
                        </TableCell>
                        <TableCell align="right">
                          {assignment.assignment_percent}%
                        </TableCell>
                        <TableCell align="right">
                          {assignment.score}%
                        </TableCell>
                        <TableCell align="right">
                          {((assignment.score * assignment.assignment_percent) / 100).toFixed(2)}%
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

export default StudentScores;