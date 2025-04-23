from database.DatabaseManager import DatabaseManager
from controllers.assignment_controller import AssignmentController
from controllers.score_controller import ScoreController
from views.assignment_view import AssignmentView
from views.score_view import ScoreView
from services.zip_extractor import ZipExtractor, SOURCE_DIRECTORY
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

    extractor = ZipExtractor(SOURCE_DIRECTORY)
    results = extractor.extract_all()
    
    # Print results
    for zip_name, success in results.items():
        status = "Successfully extracted" if success else "Failed to extract"
        print(f"{zip_name}: {status}")

if __name__ == "__main__":
    main()