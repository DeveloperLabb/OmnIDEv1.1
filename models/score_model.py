from pydantic import BaseModel
from sqlalchemy import Column, Integer, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from database.database import Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Score(Base):
    __tablename__ = "Scores"

    assignment_no = Column("AssignmentNO", Integer, ForeignKey("Assignment.AssignmentNO", ondelete="CASCADE"), primary_key=True)
    student_id = Column("StudentID", Integer, primary_key=True)
    score = Column("Score", Float, nullable=False, default=0.0)
    
    # Relationship to Assignment
    assignment = relationship("Assignment", back_populates="scores")
    
    # Add an index to student_id for faster lookups
    __table_args__ = (
        Index('idx_student_id', "StudentID"),
    )
    
    def __repr__(self):
        return f"<Score(assignment_no={self.assignment_no}, student_id={self.student_id}, score={self.score})>"

class ScoreCreate(BaseModel):
    assignment_no: int
    student_id: int
    score: float

class ScoreResponse(BaseModel):
    assignment_no: int
    student_id: int
    score: float
    
    # Optional fields that can be included when joining with Assignment
    assignment_name: str = None
    assignment_date: str = None
    assignment_percent: float = None

    class Config:
        from_attributes = True