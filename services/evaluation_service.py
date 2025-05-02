from sqlalchemy.orm import Session
from models.assignment_model import Assignment
from models.score_model import Score
import os
import glob
import json
from typing import List, Dict, Any, Optional
import re


class EvaluationService:
    def __init__(self, db: Session):
        self.db = db

    def evaluate_specific_assignment(self, assignment_no: int, base_dir: str) -> List[Dict[str, Any]]:
        """
        Evaluate submissions for a specific assignment.

        Args:
            assignment_no: The assignment number
            base_dir: The base directory containing the extracted submissions

        Returns:
            A list of evaluation results
        """
        # Get the assignment details
        assignment = self.db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not assignment:
            raise ValueError(f"Assignment {assignment_no} not found")

        # Get the expected output
        expected_output = assignment.correct_output.strip()

        # Get the assignment directory
        assignment_dir = os.path.join(base_dir, assignment.assignment_name)
        if not os.path.exists(assignment_dir):
            return []

        # Load student mappings if available
        student_mappings = self._load_student_mappings(assignment_dir)

        # Get student submissions directory
        student_submissions_dir = os.path.join(assignment_dir, "student_submissions")
        if not os.path.exists(student_submissions_dir):
            return []

        # Find all student directories
        student_dirs = [d for d in os.listdir(student_submissions_dir)
                        if os.path.isdir(os.path.join(student_submissions_dir, d))]

        results = []

        # Process each student directory
        for student_dir in student_dirs:
            student_id = self._extract_student_id(student_dir, student_mappings)

            if not student_id:
                # Skip if we can't determine a student ID
                continue

            # Try to convert student_id to integer if it's a number
            try:
                student_id_int = int(student_id)
            except ValueError:
                # Use a hash of the string if it's not a valid integer
                student_id_int = hash(student_id) % 10000000

            # Find the student's submission files
            submission_path = os.path.join(student_submissions_dir, student_dir)
            output, matched = self._evaluate_submission(submission_path, expected_output, assignment.args)

            # Record the result
            result = {
                "student_id": student_id_int,
                "assignment_no": assignment_no,
                "assignment_name": assignment.assignment_name,
                "score": 100.0 if matched else 0.0,
                "matched": matched,
                "student_output": output,
                "expected_output": expected_output
            }

            # Store the score in the database
            self._update_score(student_id_int, assignment_no, 100.0 if matched else 0.0)

            results.append(result)

        return results

    def evaluate_all_assignments(self, base_dir: str) -> List[Dict[str, Any]]:
        """
        Evaluate submissions for all assignments.

        Args:
            base_dir: The base directory containing the extracted submissions

        Returns:
            A list of evaluation results
        """
        # Get all assignments
        assignments = self.db.query(Assignment).all()

        all_results = []

        # Evaluate each assignment
        for assignment in assignments:
            results = self.evaluate_specific_assignment(assignment.assignment_no, base_dir)
            all_results.extend(results)

        return all_results

    def _load_student_mappings(self, assignment_dir: str) -> Dict[str, str]:
        """Load student mappings from the mapping file if it exists."""
        mapping_file = os.path.join(assignment_dir, "student_mappings.json")
        if os.path.exists(mapping_file):
            try:
                with open(mapping_file, 'r') as f:
                    data = json.load(f)
                    return data.get('zip_to_student_id', {})
            except Exception as e:
                print(f"Error loading student mappings: {str(e)}")
        return {}

    def _extract_student_id(self, directory_name: str, student_mappings: Dict[str, str]) -> Optional[str]:
        """
        Extract student ID from directory name or mapping file.

        Priority:
        1. Check if directory name is already a student ID (all digits)
        2. Check if there's a mapping for this directory
        3. Try to extract student ID pattern from directory name
        """
        # If directory name is already a student ID (all digits)
        if directory_name.isdigit():
            return directory_name

        # Check if the directory name is in the student mappings
        for zip_name, student_id in student_mappings.items():
            # Remove .zip extension for comparison
            base_zip_name = zip_name.rsplit('.', 1)[0] if '.' in zip_name else zip_name
            if base_zip_name == directory_name:
                return student_id

        # Try to extract student ID pattern from directory name
        # Looking for digit sequences that are likely to be student IDs
        match = re.search(r'(\d{8,12})', directory_name)
        if match:
            return match.group(1)

        # If we can't determine a student ID, use the directory name as the identifier
        return directory_name

    def _evaluate_submission(self, submission_path: str, expected_output: str, args: Optional[str] = None) -> tuple:
        """
        Evaluate a student submission.

        Args:
            submission_path: Path to the student's submission
            expected_output: Expected output for the assignment
            args: Command-line arguments for the submission

        Returns:
            A tuple of (output, matched)
        """
        try:
            # Find the main file to execute
            main_file = self._find_main_file(submission_path)
            if not main_file:
                return ("No executable file found", False)

            # Import the language_read module for compilation and execution
            from services.language_read import compile_and_run

            # Execute the file
            args_list = args.split() if args else []
            output = compile_and_run(main_file, args_list)

            # Compare output to expected output
            # Strip whitespace and normalize line endings
            output_normalized = output.strip().replace('\r\n', '\n')
            expected_normalized = expected_output.strip().replace('\r\n', '\n')

            matched = output_normalized == expected_normalized

            return (output, matched)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Error evaluating submission: {error_details}")
            return (f"Error: {str(e)}", False)

    def _find_main_file(self, submission_path: str) -> Optional[str]:
        """
        Find the main file to execute in a submission.

        Args:
            submission_path: Path to the submission directory

        Returns:
            Path to the main file, or None if not found
        """
        # Check for common main file patterns
        main_file_patterns = ['main.py', 'main.java', 'main.c', 'main.cpp', 'program.cs', 'main.js', 'main.go']
        file_extensions = ['.py', '.java', '.c', '.cpp', '.cs', '.js', '.go']

        # First, look for exact matches to main file patterns
        for pattern in main_file_patterns:
            for file in glob.glob(os.path.join(submission_path, "**", pattern), recursive=True):
                if os.path.isfile(file) and not os.path.basename(file).startswith('.'):
                    return file

        # If no exact match, look for files with supported extensions
        candidate = None
        for ext in file_extensions:
            for file in glob.glob(os.path.join(submission_path, "**", f"*{ext}"), recursive=True):
                if os.path.isfile(file) and not os.path.basename(file).startswith('.'):
                    # If we haven't found a candidate yet, use this one
                    if not candidate:
                        candidate = file

                    # If the file has a name that suggests it's a main file, prioritize it
                    if os.path.basename(file).lower().startswith('main'):
                        return file

        return candidate

    def _update_score(self, student_id: int, assignment_no: int, score: float) -> None:
        """
        Update or create a score record.

        Args:
            student_id: The student ID
            assignment_no: The assignment number
            score: The score to record
        """
        try:
            # Check if a score record already exists
            existing_score = self.db.query(Score).filter(
                Score.student_id == student_id,
                Score.assignment_no == assignment_no
            ).first()

            if existing_score:
                # Update existing score
                existing_score.score = score
            else:
                # Create new score
                new_score = Score(
                    student_id=student_id,
                    assignment_no=assignment_no,
                    score=score
                )
                self.db.add(new_score)

            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"Error updating score: {str(e)}")