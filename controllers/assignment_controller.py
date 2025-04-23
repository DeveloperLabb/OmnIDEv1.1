from typing import List, Optional
from models.assignment_model import Assignment
from database.DatabaseManager import DatabaseManager
from datetime import date

class AssignmentController:
    def __init__(self):
        self.db = DatabaseManager()

    def create_assignment(self, assignment_no: int, assignment_date: date, 
                        assignment_percent: float) -> Optional[Assignment]:
        query = "INSERT INTO Assignment (AssignmentNO, AssignmentDate, AssignmentPercent) VALUES (?, ?, ?)"
        result = self.db.execute_query(query, (assignment_no, assignment_date, assignment_percent))
        if result:
            return self.get_assignment(assignment_no)
        return None

    def get_assignment(self, assignment_no: int) -> Optional[Assignment]:
        query = "SELECT * FROM Assignment WHERE AssignmentNO = ?"
        result = self.db.execute_query(query, (assignment_no,))
        return Assignment.from_db_row(result[0]) if result else None

    def get_all_assignments(self) -> List[Assignment]:
        query = "SELECT * FROM Assignment"
        results = self.db.execute_query(query)
        return [Assignment.from_db_row(row) for row in results] if results else []