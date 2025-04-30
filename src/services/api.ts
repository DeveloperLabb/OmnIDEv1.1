interface Assignment {
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const createAssignment = async (data: Assignment) => {
  const formattedData = {
    ...data,
    assignment_date: data.assignment_date, // Date is already in YYYY-MM-DD format from the form
    assignment_percent: Number(data.assignment_percent)
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
