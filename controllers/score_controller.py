from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.assignment_model import Assignment
from models.score_model import Score, ScoreResponse
from database.database import get_db
from pydantic import BaseModel
import os
from services.evaluation_service import EvaluationService

class ScoreCreate(BaseModel):
    assignment_no: int
    student_id: int
    score: float

class EvaluationRequest(BaseModel):
    assignment_no: int = None  # If None, evaluate all assignments

class EvaluationResult(BaseModel):
    student_id: int
    assignment_no: int
    assignment_name: Optional[str] = None
    score: float
    matched: bool
    student_output: Optional[str] = None
    expected_output: Optional[str] = None

class ScoreController:
    def __init__(self):
        self.router = APIRouter(prefix="/scores", tags=["scores"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/", self.create_score, methods=["POST"], response_model=ScoreResponse)
        self.router.add_api_route("/{assignment_no}/{student_id}", self.get_score, methods=["GET"], response_model=ScoreResponse)
        self.router.add_api_route("/student/{student_id}", self.get_student_scores, methods=["GET"], response_model=List[ScoreResponse])
        self.router.add_api_route("/evaluate", self.evaluate_submissions, methods=["POST"], response_model=List[EvaluationResult])
        # Add new routes
        self.router.add_api_route("/assignments", self.get_assignment_scores, methods=["GET"])
        self.router.add_api_route("/students", self.get_student_scores, methods=["GET"])

    async def create_score(self, score: ScoreCreate, db: Session = Depends(get_db)) -> Score:
        db_score = Score(
            assignment_no=score.assignment_no,
            student_id=score.student_id,
            score=score.score
        )
        try:
            db.add(db_score)
            db.commit()
            db.refresh(db_score)
            return db_score
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def get_score(self, assignment_no: int, student_id: int, db: Session = Depends(get_db)) -> Score:
        db_score = db.query(Score).filter(
            Score.assignment_no == assignment_no,
            Score.student_id == student_id
        ).first()
        if not db_score:
            raise HTTPException(
                status_code=404, 
                detail=f"Score not found for assignment {assignment_no} and student {student_id}"
            )
        return db_score

    async def get_student_scores(self, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
        """Get scores grouped by student with statistics"""
        
        # Get all scores
        scores = db.query(Score).all()
        
        # Group by student
        student_groups = {}
        for score in scores:
            if score.student_id not in student_groups:
                student_groups[score.student_id] = []
            student_groups[score.student_id].append(score)
        
        # Get all assignments for looking up assignment details
        assignments = {a.assignment_no: a for a in db.query(Assignment).all()}
        
        results = []
        
        for student_id, student_scores in student_groups.items():
            # Compile assignment details
            assignment_details = []
            total_score = 0
            total_weighted_score = 0
            total_weight = 0
            
            for score in student_scores:
                assignment = assignments.get(score.assignment_no)
                
                if assignment:
                    # Calculate weighted score for this assignment
                    weighted_score = (score.score * assignment.assignment_percent) / 100
                    total_score += score.score
                    total_weighted_score += weighted_score
                    total_weight += assignment.assignment_percent
                    
                    assignment_details.append({
                        "assignment_no": assignment.assignment_no,
                        "assignment_name": assignment.assignment_name,
                        "assignment_percent": assignment.assignment_percent,
                        "score": score.score
                    })
            
            average_score = total_score / len(student_scores) if student_scores else 0
            
            # Add result
            results.append({
                "student_id": student_id,
                "assignment_count": len(student_scores),
                "average_score": average_score,
                "total_weighted_score": total_weighted_score,
                "assignments": assignment_details
            })
        
        return results
        
    async def evaluate_submissions(self, request: EvaluationRequest, db: Session = Depends(get_db)) -> List[EvaluationResult]:
        evaluation_service = EvaluationService(db)
        submissions_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "defaultExtractLocation")
        
        if request.assignment_no:
            # Evaluate specific assignment
            results = evaluation_service.evaluate_specific_assignment(request.assignment_no, submissions_dir)
        else:
            # Evaluate all assignments
            results = evaluation_service.evaluate_all_assignments(submissions_dir)
            
        return results
        
    async def init_test_data(self, db: Session = Depends(get_db)):
        """Initialize the database with test data for testing evaluation"""
        from database.init_test_data import init_test_data
        init_test_data()
        return {"message": "Test data initialized successfully"}

    async def get_assignment_scores(self, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
        """Get scores grouped by assignment with statistics"""
        
        # Get all assignments
        assignments = db.query(Assignment).all()
        
        results = []
        
        for assignment in assignments:
            # Get all scores for this assignment
            scores = db.query(Score).filter(Score.assignment_no == assignment.assignment_no).all()
            
            # Skip if no scores
            if not scores:
                continue
                
            # Calculate average score
            total_score = sum(score.score for score in scores)
            student_count = len(scores)
            average_score = total_score / student_count if student_count > 0 else 0
            
            # Format student records
            student_records = [{"student_id": score.student_id, "score": score.score} for score in scores]
            
            # Add result
            results.append({
                "assignment_no": assignment.assignment_no,
                "assignment_name": assignment.assignment_name,
                "student_count": student_count,
                "average_score": average_score,
                "students": student_records
            })
        
        return results