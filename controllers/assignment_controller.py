from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from models.assignment_model import Assignment, AssignmentResponse
from database.database import get_db
from datetime import date
from pydantic import BaseModel
from services.zip_extractor import ZipExtractor
import os
import tempfile
import json


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


class ZipExtractionRequest(BaseModel):
    instructor_zip_path: str = ""
    student_submissions_path: str = ""
    assignment_name: str


class InstructorFileExecuteRequest(BaseModel):
    file_path: str
    args: str = ""


class StudentSubmissionInfo(BaseModel):
    student_id: str
    extracted_files: List[str]


class AssignmentController:
    def __init__(self):
        self.router = APIRouter(prefix="/assignments", tags=["assignments"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/", self.create_assignment, methods=["POST"], response_model=AssignmentResponse)
        self.router.add_api_route("/{assignment_no}", self.get_assignment, methods=["GET"],
                                  response_model=AssignmentResponse)
        self.router.add_api_route("/", self.get_all_assignments, methods=["GET"],
                                  response_model=List[AssignmentResponse])
        # Add routes for update and delete
        self.router.add_api_route("/{assignment_no}", self.update_assignment, methods=["PUT"],
                                  response_model=AssignmentResponse)
        self.router.add_api_route("/{assignment_no}", self.delete_assignment, methods=["DELETE"])
        self.router.add_api_route("/{assignment_no}/extract-zip", self.extract_zip_files, methods=["POST"])
        self.router.add_api_route("/execute-instructor-file", self.execute_instructor_file, methods=["POST"])
        # New route to get student submissions info
        self.router.add_api_route("/{assignment_no}/student-submissions", self.get_student_submissions, methods=["GET"])

    async def create_assignment(self, assignment: AssignmentCreate, db: Session = Depends(get_db)) -> Assignment:
        db_assignment = Assignment(
            assignment_name=assignment.assignment_name,
            assignment_date=assignment.assignment_date,
            assignment_percent=assignment.assignment_percent,
            correct_output=assignment.correct_output,
            args=assignment.args  # Handle optional argument
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

    async def get_all_assignments(self, db: Session = Depends(get_db)) -> List[AssignmentResponse]:
        assignments = db.query(Assignment).all()
        return [AssignmentResponse(
            assignment_no=a.assignment_no,
            assignment_name=a.assignment_name,
            assignment_date=a.assignment_date,
            assignment_percent=a.assignment_percent,
            correct_output=a.correct_output,
            args=a.args  # Return actual args from database
        ) for a in assignments]

    async def update_assignment(self, assignment_no: int, assignment: AssignmentUpdate,
                                db: Session = Depends(get_db)) -> Assignment:
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

    async def extract_zip_files(self, assignment_no: int, request: ZipExtractionRequest, db: Session = Depends(get_db)):
        # First check if the assignment exists
        db_assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not db_assignment:
            raise HTTPException(status_code=404, detail=f"Assignment {assignment_no} not found")

        # Create the assignment-specific directory in defaultExtractLocation
        app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        base_extract_dir = os.path.join(app_dir, "defaultExtractLocation")
        assignment_dir = os.path.join(base_extract_dir, request.assignment_name)

        os.makedirs(assignment_dir, exist_ok=True)

        results = {}
        student_data = {}

        # Extract instructor ZIP if provided
        if request.instructor_zip_path and os.path.exists(request.instructor_zip_path):
            instructor_dir = os.path.join(assignment_dir, "instructor")
            os.makedirs(instructor_dir, exist_ok=True)

            extractor = ZipExtractor(
                src_dir=os.path.dirname(request.instructor_zip_path),
                dst_dir=instructor_dir
            )

            # Extract the specific ZIP file
            zip_basename = os.path.basename(request.instructor_zip_path)
            success, _ = extractor.extract_zip(zip_basename)
            results["instructor_zip"] = success

        # Extract student submissions if path provided
        if request.student_submissions_path and os.path.exists(request.student_submissions_path):
            student_dir = os.path.join(assignment_dir, "student_submissions")
            os.makedirs(student_dir, exist_ok=True)

            # Initialize the ZipExtractor with the student submissions directory
            extractor = ZipExtractor(
                src_dir=request.student_submissions_path,
                dst_dir=student_dir
            )

            # Extract all ZIP files in the directory
            extraction_results = extractor.extract_all()
            results["student_zips"] = extraction_results

            # Save the student ID mappings to a JSON file for future reference
            student_mappings = {}
            for zip_name, info in extraction_results.items():
                if info['success'] and info['student_id']:
                    student_mappings[zip_name] = info['student_id']

            # Get the full student submissions data
            student_files = extractor.get_student_submissions()
            for student_id, files in student_files.items():
                student_data[student_id] = {
                    'student_id': student_id,
                    'file_count': len(files),
                    'files': [os.path.basename(f) for f in files]
                }

            # Save the mapping information to a file for future reference
            mapping_file = os.path.join(assignment_dir, "student_mappings.json")
            with open(mapping_file, 'w') as f:
                json.dump({
                    'zip_to_student_id': student_mappings,
                    'student_data': student_data
                }, f, indent=2)

        return {
            "message": f"ZIP extraction completed for assignment '{request.assignment_name}'",
            "results": results,
            "students": list(student_data.values())
        }

    async def get_student_submissions(self, assignment_no: int, db: Session = Depends(get_db)):
        """Get information about student submissions for a specific assignment"""
        # First check if the assignment exists
        db_assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not db_assignment:
            raise HTTPException(status_code=404, detail=f"Assignment {assignment_no} not found")

        # Get the assignment directory
        app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        base_extract_dir = os.path.join(app_dir, "defaultExtractLocation")
        assignment_dir = os.path.join(base_extract_dir, db_assignment.assignment_name)

        # Check if the mapping file exists
        mapping_file = os.path.join(assignment_dir, "student_mappings.json")
        if not os.path.exists(mapping_file):
            return {
                "message": f"No student submissions found for assignment '{db_assignment.assignment_name}'",
                "students": []
            }

        # Read the mapping file
        with open(mapping_file, 'r') as f:
            mapping_data = json.load(f)

        return {
            "message": f"Student submissions for assignment '{db_assignment.assignment_name}'",
            "student_count": len(mapping_data.get('student_data', {})),
            "students": list(mapping_data.get('student_data', {}).values())
        }

    async def execute_instructor_file(self, request: InstructorFileExecuteRequest):
        """Execute an instructor file and return its output"""

        # Check if file exists
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")

        try:
            # Create a temporary directory to extract the ZIP
            temp_dir = tempfile.mkdtemp()

            # Create a ZipExtractor instance
            extractor = ZipExtractor(
                src_dir=os.path.dirname(request.file_path),
                dst_dir=temp_dir
            )

            # Extract the ZIP file
            success, _ = extractor.extract_zip(os.path.basename(request.file_path))

            if not success:
                raise HTTPException(status_code=500,
                                    detail=f"Failed to extract ZIP file: {os.path.basename(request.file_path)}")

            # Find the main file to execute (look for specific file patterns)
            main_file = None
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)

                    # Skip hidden files and directories
                    if os.path.basename(file_path).startswith('.'):
                        continue

                    # Check for common main file patterns
                    if file.lower() in ['main.py', 'main.java', 'main.c', 'main.cpp', 'program.cs', 'main.js',
                                        'main.go']:
                        main_file = file_path
                        break

                    # Additional checking based on file extensions
                    _, ext = os.path.splitext(file)
                    if ext in ['.py', '.java', '.c', '.cpp', '.cs', '.js', '.go']:
                        # If we haven't found a candidate yet, use this one
                        if not main_file:
                            main_file = file_path

                # If we found a main file, stop searching
                if main_file:
                    break

            if not main_file:
                raise HTTPException(status_code=404, detail="No executable file found in the ZIP")

            # Import the language_read module for compilation and execution
            from services.language_read import compile_and_run, detect_language
            from sqlalchemy.orm import Session
            from database.database import get_db
            from models.configuration_model import Configuration
            
            # Detect the language of the file
            detected_language, language_extension = detect_language(main_file)
            config_path = None
            
            # Get database session
            db = next(get_db())
            
            # Try to find existing configuration for the detected language
            try:
                # First check if there's any config for this language
                config = db.query(Configuration).filter(Configuration.language_name == detected_language).first()
                if config:
                    config_path = config.path
                else:
                    # Determine default path based on detected language
                    default_paths = {
                        'Python': 'python' if os.name == 'posix' else 'C:\\Python310\\python.exe',
                        'Java': 'javac' if os.name == 'posix' else 'C:\\Program Files\\Java\\jdk\\bin\\javac.exe',
                        'C': 'gcc' if os.name == 'posix' else 'C:\\MinGW\\bin\\gcc.exe',
                        'C++': 'g++' if os.name == 'posix' else 'C:\\MinGW\\bin\\g++.exe',
                        'C#': 'dotnet' if os.name == 'posix' else 'C:\\Program Files\\dotnet\\dotnet.exe',
                        'Go': 'go' if os.name == 'posix' else 'C:\\Go\\bin\\go.exe',
                        'JavaScript': 'node' if os.name == 'posix' else 'C:\\Program Files\\nodejs\\node.exe'
                    }
                    
                    # If we have a default path for this language, use it
                    if detected_language in default_paths:
                        config_path = default_paths[detected_language]
                        
                        # Check if this exact path already exists for this language
                        existing_path = db.query(Configuration).filter(
                            Configuration.language_name == detected_language,
                            Configuration.path == config_path
                        ).first()
                        
                        # Only add if the path doesn't already exist
                        if not existing_path:
                            # Automatically add this configuration to the database
                            new_config = Configuration(
                                language_name=detected_language,
                                path=config_path
                            )
                            db.add(new_config)
                            db.commit()
            except Exception as db_error:
                print(f"Database error when handling configuration: {str(db_error)}")
                # Continue execution even if there's a database error
            
            # Execute the file
            args_list = request.args.split() if request.args else []
            output = compile_and_run(main_file, args_list)

            # Clean up the temporary directory
            import shutil
            shutil.rmtree(temp_dir)

            return {
                "output": output,
                "detected_language": detected_language,
                "config_path": config_path
            }
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Error executing instructor file: {error_details}")
            raise HTTPException(status_code=500, detail=f"Failed to execute instructor file: {str(e)}")