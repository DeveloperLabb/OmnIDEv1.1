import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Enable request/response logging
axios.interceptors.request.use(request => {
  console.log('Starting Request', request.url);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response.status, response.data);
  return response;
}, error => {
  console.error('API Error:', error.response ? error.response.data : error.message);
  return Promise.reject(error);
});

// Assignment interfaces
export interface AssignmentData {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

export interface Assignment {
  assignment_no: number;
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

export interface Score {
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

// Assignment functions
export const createAssignment = async (data: AssignmentData): Promise<Assignment> => {
  try {
    console.log('Creating assignment with data:', data);
    const response = await axios.post(`${API_URL}/assignments/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

export const getAssignment = async (assignmentNo: number): Promise<Assignment> => {
  try {
    const response = await axios.get(`${API_URL}/assignments/${assignmentNo}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching assignment ${assignmentNo}:`, error);
    throw error;
  }
};

export const getAllAssignments = async (): Promise<Assignment[]> => {
  try {
    console.log('Fetching all assignments');
    const response = await axios.get(`${API_URL}/assignments/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

// Score functions
export const createScore = async (data: ScoreData): Promise<Score> => {
  try {
    console.log('Creating score with data:', data);
    const response = await axios.post(`${API_URL}/scores/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating score:', error);
    throw error;
  }
};

export const getScore = async (assignmentNo: number, studentId: number): Promise<Score> => {
  try {
    const response = await axios.get(`${API_URL}/scores/${assignmentNo}/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching score for assignment ${assignmentNo}, student ${studentId}:`, error);
    throw error;
  }
};

export const getStudentScores = async (studentId: number): Promise<Score[]> => {
  try {
    const response = await axios.get(`${API_URL}/scores/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching scores for student ${studentId}:`, error);
    throw error;
  }
};

// Report functions
export const generateReports = async () => {
  try {
    const response = await axios.post(`${API_URL}/reports/generate`);
    return response.data;
  } catch (error) {
    console.error('Error generating reports:', error);
    throw error;
  }
};

export const getReportData = async () => {
  try {
    const response = await axios.get(`${API_URL}/reports/data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

// Code Runner functions
export const compileCode = async (data: CompileRequest): Promise<CompileResponse> => {
  try {
    const response = await axios.post(`${API_URL}/code/compile`, data);
    return response.data;
  } catch (error) {
    console.error('Error compiling code:', error);
    throw error;
  }
};

export const runCode = async (data: RunRequest): Promise<RunResponse> => {
  try {
    const response = await axios.post(`${API_URL}/code/run`, data);
    return response.data;
  } catch (error) {
    console.error('Error running code:', error);
    throw error;
  }
};

export const extractZip = async (formData: FormData): Promise<ExtractZipResponse> => {
  try {
    const response = await axios.post(`${API_URL}/code/extract`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error extracting zip:', error);
    throw error;
  }
};

export const getFileContent = async (path: string): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/code/file?path=${encodeURIComponent(path)}`, {
      responseType: 'text'
    });
    return response.data;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
};
  args?: string;  // Add args field
}

interface AssignmentResponse {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args: string | null;
}

interface EvaluationRequest {
  assignment_no?: number;  // Optional, if not provided will evaluate all assignments
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

const API_BASE_URL = 'http://localhost:8000/api';

export const createAssignment = async (data: Assignment) => {
  const formattedData = {
    ...data,
    assignment_date: data.assignment_date, // Date is already in YYYY-MM-DD format from the form
    assignment_percent: Number(data.assignment_percent),
    args: data.args || null  // Include args in the API request
  };

  const response = await fetch(`${API_BASE_URL}/assignments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create assignment');
  }

  return response.json();
};

export const evaluateSubmissions = async (request: EvaluationRequest): Promise<EvaluationResult[]> => {
  const response = await fetch(`${API_BASE_URL}/scores/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to evaluate submissions');
  }

  return response.json();
};

export const getAllAssignments = async (): Promise<AssignmentResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/assignments/`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch assignments');
  }
  
  return response.json();
};

export const initTestData = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/scores/init-test-data`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to initialize test data');
  }
  
  return response.json();
};

// Configuration functions
export const createConfiguration = async (data: { language_name: string; path: string }) => {
  const response = await fetch(`${API_BASE_URL}/configurations/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create configuration');
  }

  return response.json();
};

export const updateConfiguration = async (id: number, data: { language_name: string; path: string }) => {
  const response = await fetch(`${API_BASE_URL}/configurations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update configuration');
  }

  return response.json();
};

export const updateAssignment = async (assignmentNo: number, data: {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}): Promise<AssignmentResponse> => {
  const response = await fetch(`${API_BASE_URL}/assignments/${assignmentNo}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update assignment');
  }

  return response.json();
};

export const deleteAssignment = async (assignmentNo: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/assignments/${assignmentNo}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete assignment');
  }

  return response.json();
};
