import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { 
  getAllAssignments, 
  extractZip, 
  runCode, 
  getFileContent,
  createScore,
  batchProcessSubmissions
} from '../services/api';
import CodeEditor from './CodeEditor';

interface Assignment {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

interface ProcessResult {
  studentId: string;
  status: 'success' | 'failure' | 'error';
  message: string;
  output?: string;
  expectedOutput?: string;
}

const BatchProcessor: React.FC = () => {
  // State for assignment selection
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  // State for reference solution
  const [referenceSolution, setReferenceSolution] = useState<File | null>(null);
  const [referenceLanguage, setReferenceLanguage] = useState('c');
  const [referenceCode, setReferenceCode] = useState('');
  const [referenceOutput, setReferenceOutput] = useState('');
  
  // State for student submissions
  const [submissionFolder, setSubmissionFolder] = useState<string | null>(null);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [studentZipFiles, setStudentZipFiles] = useState<File[]>([]);
  
  // State for processing
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for dialogs
  const [viewCodeDialogOpen, setViewCodeDialogOpen] = useState(false);
  const [selectedStudentCode, setSelectedStudentCode] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Refs
  const solutionFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Fetch assignments on component mount
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const assignmentData = await getAllAssignments();
        setAssignments(assignmentData);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to fetch assignments');
      }
    };

    fetchAssignments();
  }, []);

  // Handle assignment selection
  const handleAssignmentChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const assignmentNo = Number(event.target.value);
    const assignment = assignments.find(a => a.assignment_no === assignmentNo) || null;
    setSelectedAssignment(assignment);
    
    // Reset reference solution when assignment changes
    setReferenceSolution(null);
    setReferenceCode('');
    setReferenceOutput('');
  };

  // Handle reference solution upload
  const handleReferenceSolutionClick = () => {
    if (solutionFileInputRef.current) {
      solutionFileInputRef.current.click();
    }
  };

  const handleReferenceSolutionChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setReferenceSolution(file);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setReferenceCode(e.target.result.toString());
        }
      };
      reader.readAsText(file);
      
      // Determine language from file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const languageMap: Record<string, string> = {
        'c': 'c',
        'cpp': 'cpp',
        'py': 'python',
        'java': 'java',
        'js': 'javascript'
      };
      
      setReferenceLanguage(languageMap[extension] || 'c');
    }
  };

  // Handle running reference solution to get expected output
  const handleRunReferenceSolution = async () => {
    if (!referenceCode) {
      setError('Please upload a reference solution first');
      return;
    }
    
    try {
      setProcessStatus('Running reference solution...');
      const response = await runCode({
        code: referenceCode,
        language: referenceLanguage,
        args: selectedAssignment?.args
      });
      
      if (response.success) {
        setReferenceOutput(response.output);
        setSuccess('Reference solution ran successfully');
        
        // Update the assignment's correct output if it was empty
        if (selectedAssignment && !selectedAssignment.correct_output) {
          setSelectedAssignment({
            ...selectedAssignment,
            correct_output: response.output.trim()
          });
        }
      } else {
        setError(`Failed to run reference solution: ${response.output}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setProcessStatus('');
    }
  };

  // Handle folder selection
  const handleFolderSelect = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleFolderSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files).filter(file => 
        file.name.endsWith('.zip') && 
        /^\d+\.zip$/.test(file.name) // Verify the file name is numeric before .zip
      );
      
      if (files.length > 0) {
        setStudentZipFiles(files);
        setSubmissionFolder(`${files.length} zip files selected`);
        setSuccess(`Found ${files.length} student submission ZIP files`);
      } else {
        setError('No valid student submission ZIP files found');
      }
    }
  };

  // Process student submissions
  const processStudentSubmissions = async () => {
    if (!selectedAssignment) {
      setError('Please select an assignment first');
      return;
    }
    
    if (!referenceOutput && !selectedAssignment.correct_output) {
      setError('Please run the reference solution first or ensure the assignment has a correct output');
      return;
    }
    
    if (studentZipFiles.length === 0) {
      setError('Please select student submission ZIP files first');
      return;
    }
    
    setIsProcessing(true);
    setResults([]);
    setError(null);
    setSuccess(null);
    
    const expectedOutput = referenceOutput || selectedAssignment.correct_output;
    const newResults: ProcessResult[] = [];
    
    try {
      // Process student submissions in batches
      for (let i = 0; i < studentZipFiles.length; i++) {
        const zipFile = studentZipFiles[i];
        const studentId = zipFile.name.replace('.zip', '');
        
        setProcessStatus(`Processing student ${i+1}/${studentZipFiles.length}: ${studentId}`);
        
        try {
          // Extract the ZIP file
          const formData = new FormData();
          formData.append('file', zipFile);
          
          const extractResult = await extractZip(formData);
          
          if (!extractResult.success) {
            newResults.push({
              studentId,
              status: 'error',
              message: 'Failed to extract ZIP file'
            });
            continue;
          }
          
          // Find a matching main file in the extracted files
          // Common names for main files in different languages
          const mainFilePatterns = [
            'main.c', 'main.cpp', 'main.java', 'main.py', 'Main.java',
            'solution.c', 'solution.cpp', 'solution.java', 'solution.py',
            'assignment.c', 'assignment.cpp', 'assignment.java', 'assignment.py'
          ];
          
          let mainFile = null;
          for (const pattern of mainFilePatterns) {
            if (extractResult.files.includes(pattern)) {
              mainFile = pattern;
              break;
            }
          }
          
          if (!mainFile) {
            newResults.push({
              studentId,
              status: 'error',
              message: 'No main file found in submission'
            });
            continue;
          }
          
          // Get the file content
          const fileContent = await getFileContent(`${extractResult.extract_path}/${mainFile}`);
          
          // Determine the language
          const extension = mainFile.split('.').pop()?.toLowerCase() || '';
          const languageMap: Record<string, string> = {
            'c': 'c',
            'cpp': 'cpp',
            'py': 'python',
            'java': 'java',
            'js': 'javascript'
          };
          
          const language = languageMap[extension] || 'c';
          
          // Run the code
          const runResult = await runCode({
            code: fileContent,
            language,
            args: selectedAssignment.args
          });
          
          if (!runResult.success) {
            newResults.push({
              studentId,
              status: 'error',
              message: 'Code execution failed',
              output: runResult.output,
              expectedOutput
            });
            
            // Save the failure to the database
            await createScore({
              assignment_no: selectedAssignment.assignment_no,
              student_id: parseInt(studentId),
              score: 0
            });
            
            continue;
          }
          
          // Compare the output with the expected output
          const actualOutput = runResult.output.trim();
          const expectedOutputTrimmed = expectedOutput.trim();
          
          if (actualOutput === expectedOutputTrimmed) {
            newResults.push({
              studentId,
              status: 'success',
              message: 'Output matches expected result',
              output: actualOutput,
              expectedOutput: expectedOutputTrimmed
            });
            
            // Save the success to the database
            await createScore({
              assignment_no: selectedAssignment.assignment_no,
              student_id: parseInt(studentId),
              score: selectedAssignment.assignment_percent
            });
          } else {
            newResults.push({
              studentId,
              status: 'failure',
              message: 'Output does not match expected result',
              output: actualOutput,
              expectedOutput: expectedOutputTrimmed
            });
            
            // Save the failure to the database
            await createScore({
              assignment_no: selectedAssignment.assignment_no,
              student_id: parseInt(studentId),
              score: 0
            });
          }
          
        } catch (error) {
          newResults.push({
            studentId,
            status: 'error',
            message: error instanceof Error ? error.message : 'An unknown error occurred'
          });
        }
        
        // Update results after each student
        setResults([...newResults]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
      setSuccess(`Processed ${studentZipFiles.length} student submissions`);
    }
  };

  // Handle viewing student code
  const handleViewStudentCode = async (studentId: string) => {
    try {
      // Find the zip file for this student
      const zipFile = studentZipFiles.find(file => file.name.replace('.zip', '') === studentId);
      
      if (!zipFile) {
        setError(`Could not find ZIP file for student ${studentId}`);
        return;
      }
      
      // Extract the ZIP file
      const formData = new FormData();
      formData.append('file', zipFile);
      
      const extractResult = await extractZip(formData);
      
      if (!extractResult.success) {
        setError('Failed to extract ZIP file');
        return;
      }
      
      // Find a matching main file in the extracted files
      const mainFilePatterns = [
        'main.c', 'main.cpp', 'main.java', 'main.py', 'Main.java',
        'solution.c', 'solution.cpp', 'solution.java', 'solution.py',
        'assignment.c', 'assignment.cpp', 'assignment.java', 'assignment.py'
      ];
      
      let mainFile = null;
      for (const pattern of mainFilePatterns) {
        if (extractResult.files.includes(pattern)) {
          mainFile = pattern;
          break;
        }
      }
      
      if (!mainFile) {
        setError('No main file found in submission');
        return;
      }
      
      // Get the file content
      const fileContent = await getFileContent(`${extractResult.extract_path}/${mainFile}`);
      
      setSelectedStudentCode(fileContent);
      setSelectedStudentId(studentId);
      setViewCodeDialogOpen(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // Steps for the stepper
  const steps = [
    'Select Assignment',
    'Upload Reference Solution',
    'Select Student Submissions',
    'Process and Compare'
  ];

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Batch Assignment Processor
        </Typography>
        
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step 1: Select Assignment */}
        {currentStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select an Assignment
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="assignment-select-label">Assignment</InputLabel>
              <Select
                labelId="assignment-select-label"
                id="assignment-select"
                value={selectedAssignment ? selectedAssignment.assignment_no : ''}
                label="Assignment"
                onChange={handleAssignmentChange}
              >
                {assignments.map((assignment) => (
                  <MenuItem key={assignment.assignment_no} value={assignment.assignment_no}>
                    {assignment.assignment_name} ({assignment.assignment_date})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedAssignment && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1">
                  Assignment: {selectedAssignment.assignment_name}
                </Typography>
                <Typography variant="body1">
                  Date: {selectedAssignment.assignment_date}
                </Typography>
                <Typography variant="body1">
                  Percentage: {selectedAssignment.assignment_percent}%
                </Typography>
                {selectedAssignment.args && (
                  <Typography variant="body1">
                    Arguments: {selectedAssignment.args}
                  </Typography>
                )}
                {selectedAssignment.correct_output && (
                  <Typography variant="body1">
                    Expected Output: {selectedAssignment.correct_output}
                  </Typography>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={() => setCurrentStep(1)}
                disabled={!selectedAssignment}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Step 2: Upload Reference Solution */}
        {currentStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Reference Solution
            </Typography>
            
            <Box sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 3
            }}>
              <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" sx={{ mb: 2 }}>
                {referenceSolution 
                  ? `Selected file: ${referenceSolution.name}` 
                  : 'Upload a reference solution file (e.g., main.c, solution.py)'}
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleReferenceSolutionClick}
                startIcon={<CloudUploadIcon />}
              >
                Browse Files
              </Button>
              <input
                type="file"
                ref={solutionFileInputRef}
                onChange={handleReferenceSolutionChange}
                accept=".c,.cpp,.java,.py,.js"
                style={{ display: 'none' }}
              />
            </Box>
            
            {referenceSolution && (
              <Box sx={{ mb: 3 }}>
                <Button 
                  variant="contained"
                  color="secondary"
                  onClick={handleRunReferenceSolution}
                  startIcon={<PlayArrowIcon />}
                  sx={{ mb: 2 }}
                >
                  Run Reference Solution
                </Button>
                
                {referenceOutput && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Expected Output:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}
                    >
                      {referenceOutput}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={() => setCurrentStep(2)}
                disabled={!(referenceOutput || selectedAssignment?.correct_output)}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Step 3: Select Student Submissions */}
        {currentStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Student Submissions
            </Typography>
            
            <Box sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 3
            }}>
              <FolderIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" sx={{ mb: 2 }}>
                {submissionFolder 
                  ? submissionFolder 
                  : 'Select a folder containing student ZIP files'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Each ZIP file should be named with the student ID (e.g., 20220602074.zip)
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleFolderSelect}
                startIcon={<FolderIcon />}
              >
                Select Folder
              </Button>
              <input
                type="file"
                ref={folderInputRef}
                onChange={handleFolderSelectChange}
                webkitdirectory="true"
                directory="true"
                multiple
                style={{ display: 'none' }}
              />
            </Box>
            
            {studentZipFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Student Submissions ({studentZipFiles.length}):
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: '200px', overflow: 'auto' }}>
                  {studentZipFiles.map((file, index) => (
                    <Typography key={index} variant="body2">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </Typography>
                  ))}
                </Paper>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={() => setCurrentStep(3)}
                disabled={studentZipFiles.length === 0}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Step 4: Process and Compare */}
        {currentStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Process and Compare
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={processStudentSubmissions}
                disabled={isProcessing}
                fullWidth
                sx={{ mb: 2, py: 1 }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : 'Process Student Submissions'}
              </Button>
              
              {processStatus && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {processStatus}
                </Alert>
              )}
            </Box>
            
            {results.length > 0 && (
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.studentId}</TableCell>
                        <TableCell>
                          {result.status === 'success' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                              <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                              Success
                            </Box>
                          ) : result.status === 'failure' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                              <ErrorOutlineIcon sx={{ mr: 1 }} />
                              Failure
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                              <ErrorOutlineIcon sx={{ mr: 1 }} />
                              Error
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{result.message}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewStudentCode(result.studentId)}
                          >
                            View Code
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  setCurrentStep(0);
                  setSelectedAssignment(null);
                  setReferenceSolution(null);
                  setReferenceCode('');
                  setReferenceOutput('');
                  setStudentZipFiles([]);
                  setSubmissionFolder(null);
                  setResults([]);
                }}
                disabled={isProcessing || results.length === 0}
              >
                Finish
              </Button>
            </Box>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>
      
      {/* Student Code Dialog */}
      <Dialog
        open={viewCodeDialogOpen}
        onClose={() => setViewCodeDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Student Code: {selectedStudentId}
          <IconButton
            aria-label="close"
            onClick={() => setViewCodeDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedStudentCode && (
              <CodeEditor
                initialCode={selectedStudentCode}
                initialLanguage={selectedStudentCode.includes('int main') ? 'c' : 'python'}
                filename={`Student ${selectedStudentId}`}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BatchProcessor;