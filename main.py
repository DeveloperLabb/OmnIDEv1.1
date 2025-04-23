from database.DatabaseManager import DatabaseManager
from controllers.assignment_controller import AssignmentController
from controllers.score_controller import ScoreController
from views.assignment_view import AssignmentView
from views.score_view import ScoreView
from datetime import date

def main():
    # Initialize database
    db = DatabaseManager()
    db.connect()

    # Initialize controllers and views
    assignment_controller = AssignmentController()
    score_controller = ScoreController()
    assignment_view = AssignmentView()
    score_view = ScoreView()

    try:
        # Create a new assignment
        assignment = assignment_controller.create_assignment(1, date.today(), 20.0)
        if assignment:
            assignment_view.display_assignment(assignment)

        # Add a score
        score = score_controller.add_score(1, 101, 85.5)
        if score:
            score_view.display_score(score)
    finally:
        # Always close the database connection
        db.close()

if __name__ == "__main__":
    main()