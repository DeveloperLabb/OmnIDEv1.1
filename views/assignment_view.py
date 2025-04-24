from models.assignment_model import Assignment
from typing import List

class AssignmentView:
    @staticmethod
    def display_assignment(assignment: Assignment):
        print(f"\nAssignment Details:")
        print(f"Number: {assignment.assignment_no}")
        print(f"Date: {assignment.assignment_date}")
        print(f"Percent: {assignment.assignment_percent}%")

    @staticmethod
    def display_assignment_list(assignments: List[Assignment]):
        print("\nAssignment List:")
        for assignment in assignments:
            print(f"No: {assignment.assignment_no} | Date: {assignment.assignment_date} | Percent: {assignment.assignment_percent}%")