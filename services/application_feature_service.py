from sqlalchemy.orm import Session
from models.assignment_model import Assignment
from models.configuration_model import Configuration
from models.score_model import Score
from datetime import datetime
import json
from fastapi import HTTPException

class ApplicationFeatureService:
    @staticmethod
    async def export_data(db: Session):
        """Export all application data as a JSON object."""
        try:
            # Get all assignments
            assignments = db.query(Assignment).all()
            assignment_data = [
                {
                    "assignment_no": a.assignment_no,
                    "assignment_name": a.assignment_name,
                    "assignment_date": a.assignment_date.isoformat(),
                    "assignment_percent": a.assignment_percent,
                    "correct_output": a.correct_output,
                    "args": a.args
                }
                for a in assignments
            ]

            # Get all configurations
            configurations = db.query(Configuration).all()
            config_data = [
                {
                    "config_id": c.config_id,
                    "language_name": c.language_name,
                    "path": c.path
                }
                for c in configurations
            ]

            # Get all scores using only fields that exist in the model
            scores = db.query(Score).all()
            score_data = []
            for s in scores:
                score_obj = {
                    "assignment_no": s.assignment_no,
                    "student_id": s.student_id,
                    "score": s.score
                }
                score_data.append(score_obj)

            # Return complete data object
            return {
                "assignments": assignment_data,
                "configurations": config_data,
                "scores": score_data
            }

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Export error details: {error_details}")
            raise HTTPException(status_code=500, detail=f"Failed to export data: {str(e)}")

    @staticmethod
    async def import_data(data: dict, db: Session):
        """Import application data from a JSON object."""
        try:
            # Import assignments
            if "assignments" in data:
                for a_data in data["assignments"]:
                    # Check if assignment exists
                    existing = db.query(Assignment).filter(Assignment.assignment_no == a_data.get("assignment_no")).first()
                    if existing:
                        # Update existing
                        for key, value in a_data.items():
                            if key != "assignment_no":  # Don't update primary key
                                if key == "assignment_date":
                                    value = datetime.fromisoformat(value)
                                setattr(existing, key, value)
                    else:
                        # Create new
                        assignment = Assignment(
                            assignment_no=a_data.get("assignment_no"),
                            assignment_name=a_data.get("assignment_name"),
                            assignment_date=datetime.fromisoformat(a_data.get("assignment_date")),
                            assignment_percent=a_data.get("assignment_percent"),
                            correct_output=a_data.get("correct_output"),
                            args=a_data.get("args")
                        )
                        db.add(assignment)

            # Import configurations
            if "configurations" in data:
                for c_data in data["configurations"]:
                    # Check if configuration exists
                    existing = db.query(Configuration).filter(Configuration.config_id == c_data.get("config_id")).first()
                    if existing:
                        # Update existing
                        for key, value in c_data.items():
                            if key != "config_id":  # Don't update primary key
                                setattr(existing, key, value)
                    else:
                        # Create new
                        config = Configuration(
                            language_name=c_data.get("language_name"),
                            path=c_data.get("path")
                        )
                        db.add(config)

            # Import scores
            if "scores" in data:
                for s_data in data["scores"]:
                    # Check if score exists
                    existing = db.query(Score).filter(
                        Score.assignment_no == s_data.get("assignment_no"),
                        Score.student_id == s_data.get("student_id")
                    ).first()
                    if existing:
                        # Update existing
                        existing.score = s_data.get("score")
                    else:
                        # Create new
                        score = Score(
                            assignment_no=s_data.get("assignment_no"),
                            student_id=s_data.get("student_id"),
                            score=s_data.get("score")
                        )
                        db.add(score)

            db.commit()
            return {"message": "Import completed successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")