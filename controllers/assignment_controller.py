from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.assignment_model import Assignment, AssignmentResponse
from database.database import get_db
from datetime import date
from pydantic import BaseModel

class AssignmentCreate(BaseModel):
    assignment_no: int
    assignment_date: date
    assignment_percent: float

class AssignmentController:
    def __init__(self):
        self.router = APIRouter(prefix="/assignments", tags=["assignments"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/", self.create_assignment, methods=["POST"], response_model=AssignmentResponse)
        self.router.add_api_route("/{assignment_no}", self.get_assignment, methods=["GET"], response_model=AssignmentResponse)
        self.router.add_api_route("/", self.get_all_assignments, methods=["GET"], response_model=List[AssignmentResponse])

    async def create_assignment(self, assignment: AssignmentCreate, db: Session = Depends(get_db)) -> Assignment:
        db_assignment = Assignment(
            assignment_no=assignment.assignment_no,
            assignment_date=assignment.assignment_date,
            assignment_percent=assignment.assignment_percent
        )
        try:
            db.add(db_assignment)
            db.commit()
            db.refresh(db_assignment)
            return db_assignment
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def get_assignment(self, assignment_no: int, db: Session = Depends(get_db)) -> Assignment:
        db_assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not db_assignment:
            raise HTTPException(status_code=404, detail=f"Assignment {assignment_no} not found")
        return db_assignment

    async def get_all_assignments(self, db: Session = Depends(get_db)) -> List[Assignment]:
        return db.query(Assignment).all()