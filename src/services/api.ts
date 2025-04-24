import { AssignmentCreate, Assignment } from '../types/assignment';

const API_BASE_URL = 'http://localhost:8000/api';

export const createAssignment = async (assignment: AssignmentCreate): Promise<Assignment> => {
    const response = await fetch(`${API_BASE_URL}/assignments/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'Failed to create assignment');
    }

    return data;
};
