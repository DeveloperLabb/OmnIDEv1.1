from models.score_model import Score
from typing import List

class ScoreView:
    @staticmethod
    def display_score(score: Score):
        print(f"\nScore Details:")
        print(f"Assignment No: {score.assignment_no}")
        print(f"Student ID: {score.student_id}")
        print(f"Score: {score.score}")

    @staticmethod
    def display_student_scores(scores: List[Score]):
        print("\nStudent Scores:")
        for score in scores:
            print(f"Assignment: {score.assignment_no} | Score: {score.score}")