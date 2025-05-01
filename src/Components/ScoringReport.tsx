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
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { getStudentScores, getAssignment, getAllAssignments } from '../services/api';

interface Score {
  assignment_no: number;
  student_id: number;
  score: number;
}

interface Assignment {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
}

interface ScoreWithAssignment extends Score {
  assignment_name: string;
  assignment_date: string;
  status: 'pass' | 'fail';
}

const ScoringReport: React.FC = () => {
  const [scores, setScores] = useState<ScoreWithAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [passedSubmissions, setPassedSubmissions] = useState<number>(0);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch all assignments
      const assignmentsData = await getAllAssignments();
      setAssignments(assignmentsData);
      
      // Then fetch scores for all students
      const processedScores: ScoreWithAssignment[] = [];
      const studentIdsSet = new Set<number>();
      let passed = 0;
      let total = 0;
      
      // This would normally involve multiple API calls in a real-world scenario
      // For demo purposes, we'll use a simpler approach with the data we have
      for (const assignment of assignmentsData) {
        try {
          // In a real implementation, you might have an API to get all scores for an assignment
          // For now, we'll simulate it with some sample data
          const sampleStudentIds = [20220602074, 20220602075, 20220602076, 20220602077];
          
          for (const studentId of sampleStudentIds) {
            try {
              const scoreData = await getStudentScores(studentId);
              
              // Filter scores for the current assignment
              const assignmentScores = scoreData.filter(
                (score: Score) => score.assignment_no === assignment.assignment_no
              );
              
              if (assignmentScores.length > 0) {
                for (const score of assignmentScores) {
                  studentIdsSet.add(score.student_id);
                  total++;
                  
                  const status = score.score > 0 ? 'pass' : 'fail';
                  if (status === 'pass') passed++;
                  
                  processedScores.push({
                    ...score,
                    assignment_name: assignment.assignment_name,
                    assignment_date: assignment.assignment_date,
                    status: status
                  });
                }
              }
            } catch (studentError) {
              console.error(`Error fetching scores for student ${studentId}:`, studentError);
            }
          }
        } catch (assignmentError) {
          console.error(`Error processing assignment ${assignment.assignment_no}:`, assignmentError);
        }
      }
      
      setScores(processedScores);
      setStudentIds(Array.from(studentIdsSet));
      setTotalSubmissions(total);
      setPassedSubmissions(passed);
      
    } catch (error) {
      setError('Failed to fetch scoring data. Please try again later.');
      console.error('Error fetching scoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Generate a report summary
  const renderSummary = () => {
    if (scores.length === 0) return null;
    
    const passRate = totalSubmissions > 0 ? (passedSubmissions / totalSubmissions) * 100 : 0;
    
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="body1">Total Students: {studentIds.length}</Typography>
            <Typography variant="body1">Total Submissions: {totalSubmissions}</Typography>
            <Typography variant="body1">Passed Submissions: {passedSubmissions}</Typography>
          </Box>
          <Box>
            <Typography variant="body1">Pass Rate: {passRate.toFixed(2)}%</Typography>
            <Typography variant="body1">Assignments: {assignments.length}</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Scoring Report</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchAllData}
          disabled={loading}
        >
          Refresh Data
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
      ) : (
        <>
          {renderSummary()}
          
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No scoring data available
                    </TableCell>
                  </TableRow>
                ) : (
                  scores.map((score, index) => (
                    <TableRow key={index}>
                      <TableCell>{score.student_id}</TableCell>
                      <TableCell>{score.assignment_name}</TableCell>
                      <TableCell>{formatDate(score.assignment_date)}</TableCell>
                      <TableCell>{score.score}</TableCell>
                      <TableCell>
                        <Chip 
                          label={score.status === 'pass' ? 'PASSED' : 'FAILED'} 
                          color={score.status === 'pass' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ScoringReport;