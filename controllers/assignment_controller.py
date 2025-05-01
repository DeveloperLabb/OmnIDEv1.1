from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Response, status
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from models.assignment_model import Assignment, AssignmentResponse
from database.database import get_db
from datetime import date
from pydantic import BaseModel
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssignmentCreate(BaseModel):
    assignment_name: str
    assignment_date: date
    assignment_percent: float
    correct_output: str
    args: Optional[str] = None  # Optional argument with default value None

class AssignmentUpdate(BaseModel):
    assignment_name: Optional[str] = None
    assignment_date: Optional[date] = None
    assignment_percent: Optional[float] = None
    correct_output: Optional[str] = None
    args: Optional[str] = None

class AssignmentController:
    def __init__(self):
        self.router = APIRouter(prefix="/assignments", tags=["assignments"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/", self.create_assignment, methods=["POST"], response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
        self.router.add_api_route("/{assignment_no}", self.get_assignment, methods=["GET"], response_model=AssignmentResponse)
        self.router.add_api_route("/", self.get_all_assignments, methods=["GET"], response_model=List[AssignmentResponse])
        # Add routes for update and delete
        self.router.add_api_route("/{assignment_no}", self.update_assignment, methods=["PUT"], response_model=AssignmentResponse)
        self.router.add_api_route("/{assignment_no}", self.delete_assignment, methods=["DELETE"])

    async def create_assignment(self, assignment: AssignmentCreate, db: Session = Depends(get_db)) -> Assignment:
        try:
            logger.info(f"Creating assignment: {assignment.assignment_name}")
            
            # Create new assignment object
            db_assignment = Assignment(
                assignment_name=assignment.assignment_name,
                assignment_date=assignment.assignment_date,
                assignment_percent=assignment.assignment_percent,
                correct_output=assignment.correct_output,
                args=assignment.args  # Handle optional argument
            )
            
            # Add to database
            db.add(db_assignment)
            db.commit()
            db.refresh(db_assignment)
            
            logger.info(f"Assignment created with ID: {db_assignment.assignment_no}")
            return db_assignment
        except Exception as e:
            logger.error(f"Error creating assignment: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Could not create assignment: {str(e)}")

    async def get_assignment(self, assignment_no: int, db: Session = Depends(get_db)) -> Assignment:
        logger.info(f"Getting assignment {assignment_no}")
        db_assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not db_assignment:
            logger.warning(f"Assignment {assignment_no} not found")
            raise HTTPException(status_code=404, detail=f"Assignment {assignment_no} not found")
        return db_assignment

    async def get_all_assignments(self, db: Session = Depends(get_db)) -> List[AssignmentResponse]:
        logger.info("Getting all assignments")
    async def get_all_assignments(self, db: Session = Depends(get_db)) -> List[AssignmentResponse]:
        assignments = db.query(Assignment).all()
        
        # Convert to response models
        result = [
            AssignmentResponse(
                assignment_no=a.assignment_no,
                assignment_name=a.assignment_name,
                assignment_date=a.assignment_date,
                assignment_percent=a.assignment_percent,
                correct_output=a.correct_output,
                args=a.args
            ) for a in assignments
        ]
        
        logger.info(f"Found {len(result)} assignments")
        return result
        return [AssignmentResponse(
            assignment_no=a.assignment_no,
            assignment_name=a.assignment_name,
            assignment_date=a.assignment_date,
            assignment_percent=a.assignment_percent,
            correct_output=a.correct_output,
            args=a.args  # Return actual args from database
        ) for a in assignments]

    async def update_assignment(self, assignment_no: int, assignment: AssignmentUpdate, db: Session = Depends(get_db)) -> Assignment:
        db_assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not db_assignment:
            raise HTTPException(status_code=404, detail=f"Assignment {assignment_no} not found")

        # Update only provided fields
        update_data = assignment.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:  # Skip None values
                setattr(db_assignment, key, value)

        try:
            db.commit()
            db.refresh(db_assignment)
            return db_assignment
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def delete_assignment(self, assignment_no: int, db: Session = Depends(get_db)):
        db_assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not db_assignment:
            raise HTTPException(status_code=404, detail=f"Assignment {assignment_no} not found")

        try:
            db.delete(db_assignment)
            db.commit()
            return {"message": f"Assignment {assignment_no} deleted successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))