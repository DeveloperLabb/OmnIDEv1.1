from datetime import date
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy import Column, Integer, Float, Date
from sqlalchemy.orm import relationship
from database.database import Base

class Assignment(Base):
    __tablename__ = "Assignment"

    assignment_no = Column("AssignmentNO", Integer, primary_key=True)
    assignment_date = Column("AssignmentDate", Date)
    assignment_percent = Column("AssignmentPercent", Float)
    
    scores = relationship("Score", back_populates="assignment", cascade="all, delete-orphan")

# Add Pydantic model for response
class AssignmentResponse(BaseModel):
    assignment_no: int
    assignment_date: date
    assignment_percent: float

    class Config:
        from_attributes = True