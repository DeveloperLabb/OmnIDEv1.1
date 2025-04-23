from pydantic import BaseModel
from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Score(Base):
    __tablename__ = "Scores"

    assignment_no = Column("AssignmentNO", Integer, ForeignKey("Assignment.AssignmentNO"), primary_key=True)
    student_id = Column("StudentID", Integer, primary_key=True)
    score = Column("Score", Float)
    
    assignment = relationship("Assignment", back_populates="scores")

class ScoreResponse(BaseModel):
    assignment_no: int
    student_id: int
    score: float

    class Config:
        from_attributes = True