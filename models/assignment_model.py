from datetime import date
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy import Column, Integer, Float, Date, String, Index, Text
from sqlalchemy.orm import relationship
from database.database import Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Assignment(Base):
    __tablename__ = "Assignment"

    assignment_no = Column("AssignmentNO", Integer, primary_key=True, autoincrement=True)
    assignment_name = Column("AssignmentName", String(255), nullable=False)
    assignment_date = Column("AssignmentDate", Date, nullable=False)
    assignment_percent = Column("AssignmentPercent", Float, nullable=False)
    correct_output = Column("CorrectOutput", Text, nullable=False)  # Change to Text for larger output
    args = Column("Arguments", String(255), nullable=True)  # Optional argument
    
    # Add an index to assignment_name for faster lookups
    __table_args__ = (
        Index('idx_assignment_name', "AssignmentName"),
    )
    
    # Relationship with scores
    scores = relationship("Score", back_populates="assignment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Assignment(assignment_no={self.assignment_no}, name='{self.assignment_name}')>"

class AssignmentCreate(BaseModel):
    assignment_name: str
    assignment_date: date
    assignment_percent: float
    correct_output: str
    args: Optional[str] = None

class AssignmentResponse(BaseModel):
    assignment_no: int
    assignment_name: str
    assignment_date: date
    assignment_percent: float
    correct_output: str
    args: Optional[str] = None
    
    # Optional field to include the count of submissions
    submission_count: Optional[int] = None

    class Config:
        from_attributes = True