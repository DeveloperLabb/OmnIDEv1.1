import os
import glob
import re
from pathlib import Path
from sqlalchemy.orm import Session
from models.assignment_model import Assignment
from models.score_model import Score
from services.language_read import compile_and_run

class EvaluationService:
    def __init__(self, db: Session):
        self.db = db
        
    def extract_student_id(self, folder_name):
        # Extract student ID from folder names like "20220602074"
        match = re.match(r"(\d+)", folder_name)
        if match:
            return int(match.group(1))
        return None
        
    def evaluate_all_assignments(self, submissions_dir):
        """
        Evaluates all student submissions for all assignments
        """
        results = []
        
        # Get all assignments from database
        assignments = self.db.query(Assignment).all()
        
        # Get all student folders
        student_folders = [f.name for f in os.scandir(submissions_dir) if f.is_dir()]
        
        for folder in student_folders:
            student_id = self.extract_student_id(folder)
            if not student_id:
                continue
                
            student_dir = os.path.join(submissions_dir, folder)
            
            for assignment in assignments:
                result = self.evaluate_assignment(student_id, student_dir, assignment)
                if result:
                    results.append(result)
                    
        return results
        
    def evaluate_assignment(self, student_id, student_dir, assignment):
        """
        Evaluates a single student's submission for a specific assignment
        """
        # Find all code files in student directory
        code_files = []
        for ext in [".c", ".cpp", ".java", ".cs", ".py", ".js", ".go"]:
            code_files.extend(glob.glob(os.path.join(student_dir, f"*{ext}")))
            
        if not code_files:
            return None
            
        # For simplicity, just take the first code file found
        # In a real system, you might want to match files by name or analyze all files
        submission_file = code_files[0]
        
        # Compile and run the submission
        print(f"Evaluating {submission_file} for student {student_id}, assignment {assignment.assignment_no}")
        student_output = compile_and_run(submission_file)
        print(f"Student output: '{student_output}', Expected: '{assignment.correct_output}'")
        
        # Compare with expected output
        expected_output = assignment.correct_output
        score_value = 100 if student_output.strip() == expected_output.strip() else 0
        
        # Store the score in database
        # Check if score already exists
        existing_score = self.db.query(Score).filter(
            Score.assignment_no == assignment.assignment_no,
            Score.student_id == student_id
        ).first()
        
        if existing_score:
            existing_score.score = score_value
        else:
            score = Score(
                assignment_no=assignment.assignment_no,
                student_id=student_id,
                score=score_value
            )
            self.db.add(score)
            
        self.db.commit()
        
        return {
            "student_id": student_id,
            "assignment_no": assignment.assignment_no,
            "assignment_name": assignment.assignment_name,
            "score": score_value,
            "matched": score_value == 100,
            "student_output": student_output.strip(),
            "expected_output": expected_output.strip()
        }

    def evaluate_specific_assignment(self, assignment_no, submissions_dir):
        """
        Evaluates all student submissions for a specific assignment
        """
        results = []
        
        # Get the assignment from database
        assignment = self.db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not assignment:
            return []
            
        # Get all student folders
        student_folders = [f.name for f in os.scandir(submissions_dir) if f.is_dir()]
        
        for folder in student_folders:
            student_id = self.extract_student_id(folder)
            if not student_id:
                continue
                
            student_dir = os.path.join(submissions_dir, folder)
            result = self.evaluate_assignment(student_id, student_dir, assignment)
            if result:
                results.append(result)
                
        return results
