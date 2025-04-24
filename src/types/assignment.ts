export interface AssignmentCreate {
    assignment_name: string;
    assignment_date: string;
    assignment_percent: number;
    correct_output: string;
}

export interface Assignment extends AssignmentCreate {
    // Additional fields if needed
}
