from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.score_model import Score, ScoreResponse
from database.database import get_db
from pydantic import BaseModel
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
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
        self.router.add_api_route("/", self.create_score, methods=["POST"], response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
        self.router.add_api_route("/{assignment_no}/{student_id}", self.get_score, methods=["GET"], response_model=ScoreResponse)
        self.router.add_api_route("/student/{student_id}", self.get_student_scores, methods=["GET"], response_model=List[ScoreResponse])
        self.router.add_api_route("/evaluate", self.evaluate_submissions, methods=["POST"], response_model=List[EvaluationResult])
        self.router.add_api_route("/init-test-data", self.init_test_data, methods=["POST"])

    async def create_score(self, score: ScoreCreate, db: Session = Depends(get_db)) -> Score:
        try:
            logger.info(f"Creating score: Assignment: {score.assignment_no}, Student: {score.student_id}, Score: {score.score}")
            
            # Check if score already exists for this student/assignment
            existing_score = db.query(Score).filter(
                Score.assignment_no == score.assignment_no,
                Score.student_id == score.student_id
            ).first()
            
            if existing_score:
                logger.info(f"Score already exists. Updating from {existing_score.score} to {score.score}")
                # Update existing score
                existing_score.score = score.score
                db_score = existing_score
            else:
                # Create new score
                db_score = Score(
                    assignment_no=score.assignment_no,
                    student_id=score.student_id,
                    score=score.score
                )
                db.add(db_score)
            
            db.commit()
            db.refresh(db_score)
            logger.info(f"Score saved successfully")
            return db_score
        except Exception as e:
            logger.error(f"Error creating score: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Could not create score: {str(e)}")

    async def get_score(self, assignment_no: int, student_id: int, db: Session = Depends(get_db)) -> Score:
        logger.info(f"Getting score for assignment {assignment_no} and student {student_id}")
        db_score = db.query(Score).filter(
            Score.assignment_no == assignment_no,
            Score.student_id == student_id
        ).first()
        if not db_score:
            logger.warning(f"Score not found for assignment {assignment_no} and student {student_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"Score not found for assignment {assignment_no} and student {student_id}"
            )
        return db_score

    async def get_student_scores(self, student_id: int, db: Session = Depends(get_db)) -> List[Score]:
        logger.info(f"Getting all scores for student {student_id}")
        scores = db.query(Score).filter(Score.student_id == student_id).all()
        logger.info(f"Found {len(scores)} scores for student {student_id}")
        return scores
        return db.query(Score).filter(Score.student_id == student_id).all()
        
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