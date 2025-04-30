from sqlalchemy.orm import Session
from models.assignment_model import Assignment
from models.score_model import Score
from database.database import SessionLocal, reset_database
import datetime

def init_test_data():
    """Initialize the database with test data for assignments and scores."""
    db = SessionLocal()
    
    try:
        # First reset the database to start fresh
        reset_database()
        
        print("Adding test assignments...")
        
        # Create test assignments matching the sample code files
        assignments = [
            Assignment(
                assignment_name="Hello World Java",
                assignment_date=datetime.date(2023, 5, 15),
                assignment_percent=10.0,
                correct_output="Hello, World!",
                args=None
            ),
            Assignment(
                assignment_name="JavaScript Greeting",
                assignment_date=datetime.date(2023, 6, 1),
                assignment_percent=15.0,
                correct_output="Hello, JavaScript!",
                args=None
            ),
            Assignment(
                assignment_name="C Program",
                assignment_date=datetime.date(2023, 6, 15),
                assignment_percent=20.0,
                correct_output="Second c!",  # Removed newline character
                args=None
            ),
            Assignment(
                assignment_name="Python Test",
                assignment_date=datetime.date(2023, 7, 1),
                assignment_percent=25.0,
                correct_output="Python test output",
                args=None
            )
        ]
        
        # Add assignments to the database
        for assignment in assignments:
            db.add(assignment)
            
        db.commit()
        
        # Add some initial scores including new Python test
        # Get the created assignments with their IDs
        db_assignments = db.query(Assignment).all()
        
        # Create some test scores
        scores = [
            Score(
                assignment_no=db_assignments[0].assignment_no,
                student_id=20220602074,
                score=0  # This will be updated by the evaluation
            ),
            Score(
                assignment_no=db_assignments[1].assignment_no,
                student_id=20220602055,
                score=0  # This will be updated by the evaluation
            ),
            Score(
                assignment_no=db_assignments[2].assignment_no,
                student_id=20220602031,
                score=0  # This will be updated by the evaluation
            ),
            Score(
                assignment_no=db_assignments[3].assignment_no,  # Index for Python test assignment
                student_id=20220602054,
                score=0  # This will be updated by the evaluation
            )
        ]
        
        # Add scores to the database (optional)
        for score in scores:
            db.add(score)
        
        db.commit()
        
        print(f"Successfully added {len(assignments)} assignments and {len(scores)} initial scores")
        
        # Print the created assignments for reference
        print("\nCreated Assignments:")
        for a in db_assignments:
            print(f"ID: {a.assignment_no}, Name: {a.assignment_name}, Expected Output: '{a.correct_output}'")
            
    except Exception as e:
        db.rollback()
        print(f"Error initializing test data: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    init_test_data()
