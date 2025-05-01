interface Assignment {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
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

interface ZipExtractionRequest {
  instructor_zip_path: string;
  student_submissions_path: string;
  assignment_name: string;
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

// Import data from a file
export const importData = async (file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/features/import`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to import data');
  }
  
  return response.json();
};

// Export data as a JSON file
export const exportData = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/features/export`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export data');
  }
  
  return response.blob();
};

export const extractZipFiles = async (assignmentNo: number, data: ZipExtractionRequest): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/assignments/${assignmentNo}/extract-zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to extract ZIP files');
  }

  return response.json();
};

export const getAssignmentScores = async () => {
  const response = await fetch(`${API_BASE_URL}/scores/assignments`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch assignment scores');
  }
  
  return response.json();
};

export const getStudentScores = async () => {
  const response = await fetch(`${API_BASE_URL}/scores/students`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch student scores');
  }
  
  return response.json();
};
