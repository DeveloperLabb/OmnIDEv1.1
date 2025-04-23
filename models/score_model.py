class Score:
    def __init__(self, assignment_no: int, student_id: int, score: float):
        self.assignment_no = assignment_no
        self.student_id = student_id
        self.score = score

    @staticmethod
    def from_db_row(row: tuple):
        return Score(
            assignment_no=row[0],
            student_id=row[1],
            score=row[2]
        )