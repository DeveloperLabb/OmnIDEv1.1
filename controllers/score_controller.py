from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.score_model import Score, ScoreResponse
from database.database import get_db
from pydantic import BaseModel

class ScoreCreate(BaseModel):
    assignment_no: int
    student_id: int
    score: float

class ScoreController:
    def __init__(self):
        self.router = APIRouter(prefix="/scores", tags=["scores"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/", self.create_score, methods=["POST"], response_model=ScoreResponse)
        self.router.add_api_route("/{assignment_no}/{student_id}", self.get_score, methods=["GET"], response_model=ScoreResponse)
        self.router.add_api_route("/student/{student_id}", self.get_student_scores, methods=["GET"], response_model=List[ScoreResponse])

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

    async def get_student_scores(self, student_id: int, db: Session = Depends(get_db)) -> List[Score]:
        return db.query(Score).filter(Score.student_id == student_id).all()