import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

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

export interface CompileRequest {
  code: string;
  language: string;
  args?: string;
}

export interface RunRequest {
  code: string;
  language: string;
  input_data?: string;
  args?: string;
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
export const compileCode = async (data: CompileRequest) => {
  const response = await axios.post(`${API_URL}/code/compile`, data);
  return response.data;
};

export const runCode = async (data: RunRequest) => {
  const response = await axios.post(`${API_URL}/code/run`, data);
  return response.data;
};

export const extractZip = async (formData: FormData) => {
  const response = await axios.post(`${API_URL}/code/extract`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};