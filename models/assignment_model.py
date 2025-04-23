from datetime import date
from typing import Optional

class Assignment:
    def __init__(self, assignment_no: int, assignment_date: date, assignment_percent: float):
        self.assignment_no = assignment_no
        self.assignment_date = assignment_date
        self.assignment_percent = assignment_percent

    @staticmethod
    def from_db_row(row: tuple):
        return Assignment(
            assignment_no=row[0],
            assignment_date=row[1],
            assignment_percent=row[2]
        )