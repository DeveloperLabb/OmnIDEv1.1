from datetime import date
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy import Column, Integer, Float, Date, String
from sqlalchemy.orm import relationship
from database.database import Base

class Assignment(Base):
    __tablename__ = "Assignment"

    assignment_no = Column("AssignmentNO", Integer, primary_key=True, autoincrement=True)
    assignment_name = Column("AssignmentName", String)
    assignment_date = Column("AssignmentDate", Date)
    assignment_percent = Column("AssignmentPercent", Float)
    correct_output = Column("CorrectOutput", String)
    args = Column("Arguments", String, nullable=True)  # Optional argument
    
    scores = relationship("Score", back_populates="assignment", cascade="all, delete-orphan")

class AssignmentResponse(BaseModel):
    assignment_no: int
    assignment_name: str
    assignment_date: date
    assignment_percent: float
    correct_output: str
    args: Optional[str] = None  # Optional argument with default value None

    class Config:
        from_attributes = True