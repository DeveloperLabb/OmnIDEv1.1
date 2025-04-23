from typing import List, Optional
from models.score_model import Score
from database.DatabaseManager import DatabaseManager

class ScoreController:
    def __init__(self):
        self.db = DatabaseManager()

    def add_score(self, assignment_no: int, student_id: int, score: float) -> Optional[Score]:
        query = "INSERT INTO Scores (AssignmentNO, StudentID, Score) VALUES (?, ?, ?)"
        result = self.db.execute_query(query, (assignment_no, student_id, score))
        if result:
            return self.get_score(assignment_no, student_id)
        return None

    def get_score(self, assignment_no: int, student_id: int) -> Optional[Score]:
        query = "SELECT * FROM Scores WHERE AssignmentNO = ? AND StudentID = ?"
        result = self.db.execute_query(query, (assignment_no, student_id))
        return Score.from_db_row(result[0]) if result else None

    def get_student_scores(self, student_id: int) -> List[Score]:
        query = "SELECT * FROM Scores WHERE StudentID = ?"
        results = self.db.execute_query(query, (student_id,))
        return [Score.from_db_row(row) for row in results] if results else []