import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Assignment interfaces
export interface AssignmentData {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

export interface ScoreData {
  assignment_no: number;
  student_id: number;
  score: number;
}

// Code runner interfaces
export interface CompileRequest {
  code: string;
  language: string;
  args?: string;
}

export interface CompileResponse {
  success: boolean;
  message: string;
}

export interface RunRequest {
  code: string;
  language: string;
  input_data?: string;
  args?: string;
}

export interface RunResponse {
  success: boolean;
  output: string;
}

export interface ExtractZipResponse {
  success: boolean;
  message: string;
  extract_path: string;
  files: string[];
}

export interface BatchProcessRequest {
  assignment_no: number;
  expected_output: string;
  files: File[];
}

export interface ProcessResult {
  studentId: string;
  status: 'success' | 'failure' | 'error';
  message: string;
  output?: string;
}

export interface BatchProcessResponse {
  success: boolean;
  results: ProcessResult[];
}

// Assignment functions
export const createAssignment = async (data: AssignmentData) => {
  const response = await axios.post(`${API_URL}/assignments/`, data);
  return response.data;
};

export const getAssignment = async (assignmentNo: number) => {
  const response = await axios.get(`${API_URL}/assignments/${assignmentNo}`);
  return response.data;
};

export const getAllAssignments = async () => {
  const response = await axios.get(`${API_URL}/assignments/`);
  return response.data;
};

// Score functions
export const createScore = async (data: ScoreData) => {
  const response = await axios.post(`${API_URL}/scores/`, data);
  return response.data;
};

export const getScore = async (assignmentNo: number, studentId: number) => {
  const response = await axios.get(`${API_URL}/scores/${assignmentNo}/${studentId}`);
  return response.data;
};

export const getStudentScores = async (studentId: number) => {
  const response = await axios.get(`${API_URL}/scores/student/${studentId}`);
  return response.data;
};

// Report functions
export const generateReports = async () => {
  const response = await axios.post(`${API_URL}/reports/generate`);
  return response.data;
};

export const getReportData = async () => {
  const response = await axios.get(`${API_URL}/reports/data`);
  return response.data;
};

// Code Runner functions
export const compileCode = async (data: CompileRequest): Promise<CompileResponse> => {
  const response = await axios.post(`${API_URL}/code/compile`, data);
  return response.data;
};

export const runCode = async (data: RunRequest): Promise<RunResponse> => {
  const response = await axios.post(`${API_URL}/code/run`, data);
  return response.data;
};

export const extractZip = async (formData: FormData): Promise<ExtractZipResponse> => {
  const response = await axios.post(`${API_URL}/code/extract`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getFileContent = async (path: string): Promise<string> => {
  const response = await axios.get(`${API_URL}/code/file?path=${encodeURIComponent(path)}`, {
    responseType: 'text'
  });
  return response.data;
};

// Batch processing function
export const batchProcessSubmissions = async (data: BatchProcessRequest): Promise<BatchProcessResponse> => {
  // Create a FormData object to handle the files
  const formData = new FormData();
  formData.append('assignment_no', data.assignment_no.toString());
  formData.append('expected_output', data.expected_output);
  
  // Append all files to the FormData
  data.files.forEach((file, index) => {
    formData.append('files', file);
  });
  
  const response = await axios.post(`${API_URL}/code/batch-process`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};