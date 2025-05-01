from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from database.database import get_db
from pydantic import BaseModel
from fastapi.responses import FileResponse, PlainTextResponse
import os
import tempfile
import zipfile
import subprocess
import shutil
from typing import Dict, Optional, List
from fastapi.responses import JSONResponse
import glob
from models.score_model import Score

class CompileRequest(BaseModel):
    code: str
    language: str
    args: Optional[str] = None

class RunRequest(BaseModel):
    code: str
    language: str
    input_data: Optional[str] = None
    args: Optional[str] = None

class BatchProcessRequest(BaseModel):
    assignment_no: int
    expected_output: str
    student_id: int

class ProcessResult(BaseModel):
    student_id: str
    status: str
    message: str
    output: Optional[str] = None

class CodeRunnerController:
    def __init__(self):
        self.router = APIRouter(prefix="/code", tags=["code"])
        self._register_routes()
        self.temp_dir = tempfile.mkdtemp()
        
    def _register_routes(self):
        self.router.add_api_route("/compile", self.compile_code, methods=["POST"])
        self.router.add_api_route("/run", self.run_code, methods=["POST"])
        self.router.add_api_route("/extract", self.extract_zip, methods=["POST"])
        self.router.add_api_route("/file", self.read_file, methods=["GET"], response_class=PlainTextResponse)
        self.router.add_api_route("/batch-process", self.batch_process_submissions, methods=["POST"])
    
    async def compile_code(self, request: CompileRequest) -> Dict:
        try:
            language = request.language.lower()
            
            # Create a temporary file
            file_extension = self._get_file_extension(language)
            file_path = os.path.join(self.temp_dir, f"temp{file_extension}")
            
            # Write code to the temporary file
            with open(file_path, "w") as f:
                f.write(request.code)
            
            # Compile the code based on language
            if language == "java":
                compile_cmd = ["javac", file_path]
            elif language == "cpp" or language == "c++":
                output_path = os.path.join(self.temp_dir, "a.out")
                compile_cmd = ["g++", "-o", output_path, file_path]
            elif language == "c":
                output_path = os.path.join(self.temp_dir, "a.out")
                compile_cmd = ["gcc", "-o", output_path, file_path]
            else:
                return {"success": True, "message": f"No compilation needed for {language}"}
            
            # Execute the compilation
            process = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True
            )
            
            if process.returncode != 0:
                return {"success": False, "message": f"Compilation error: {process.stderr}"}
            
            return {"success": True, "message": "Compilation successful"}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error compiling code: {str(e)}")
    
    async def run_code(self, request: RunRequest) -> Dict:
        try:
            language = request.language.lower()
            
            # Create a temporary file
            file_extension = self._get_file_extension(language)
            file_path = os.path.join(self.temp_dir, f"temp{file_extension}")
            
            # Write code to the temporary file
            with open(file_path, "w") as f:
                f.write(request.code)
            
            # Prepare the run command based on language
            if language == "python":
                run_cmd = ["python", file_path]
            elif language == "javascript" or language == "js":
                run_cmd = ["node", file_path]
            elif language == "java":
                # First compile the Java code
                compile_cmd = ["javac", file_path]
                compile_process = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True
                )
                if compile_process.returncode != 0:
                    return {"success": False, "output": f"Compilation error: {compile_process.stderr}"}
                
                # Get class name (assuming it matches the filename)
                class_name = "temp"
                run_cmd = ["java", "-cp", self.temp_dir, class_name]
            elif language == "cpp" or language == "c++" or language == "c":
                # First compile
                output_path = os.path.join(self.temp_dir, "a.out")
                compile_cmd = ["g++", "-o", output_path, file_path] if language in ["cpp", "c++"] else ["gcc", "-o", output_path, file_path]
                compile_process = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True
                )
                if compile_process.returncode != 0:
                    return {"success": False, "output": f"Compilation error: {compile_process.stderr}"}
                
                run_cmd = [output_path]
            else:
                return {"success": False, "output": f"Unsupported language: {language}"}
            
            # Add arguments if provided
            if request.args:
                run_cmd.extend(request.args.split())
            
            # Execute the code
            input_data = request.input_data if request.input_data else None
            process = subprocess.run(
                run_cmd,
                input=input_data.encode() if input_data else None,
                capture_output=True,
                text=True
            )
            
            return {
                "success": process.returncode == 0,
                "output": process.stdout if process.returncode == 0 else process.stderr
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error running code: {str(e)}")
    
    async def extract_zip(self, file: UploadFile = File(...), extract_path: str = Form(None)) -> Dict:
        try:
            # Create a temporary directory for extraction
            if not extract_path:
                extract_path = os.path.join(self.temp_dir, "extracted")
                os.makedirs(extract_path, exist_ok=True)
            else:
                os.makedirs(extract_path, exist_ok=True)
            
            # Save the uploaded zip file
            temp_zip_path = os.path.join(self.temp_dir, file.filename)
            with open(temp_zip_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Extract the zip file
            with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            
            # Get list of extracted files
            extracted_files = []
            for root, dirs, files in os.walk(extract_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, extract_path)
                    extracted_files.append(relative_path)
                
                # Also add directory entries with a trailing slash
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                    relative_path = os.path.relpath(dir_path, extract_path) + '/'
                    extracted_files.append(relative_path)
            
            return {
                "success": True, 
                "message": "Zip extracted successfully", 
                "extract_path": extract_path,
                "files": extracted_files
            }
            
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid zip file")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting zip: {str(e)}")
    
    async def read_file(self, path: str = Query(...)) -> str:
        """
        Read and return a file's content at the given path
        """
        try:
            # Security check: ensure the path is within the temp directory
            if not os.path.abspath(path).startswith(os.path.abspath(self.temp_dir)):
                raise HTTPException(status_code=403, detail="Access denied: path is outside allowed directory")
            
            if not os.path.exists(path):
                raise HTTPException(status_code=404, detail="File not found")
            
            if os.path.isdir(path):
                raise HTTPException(status_code=400, detail="Path is a directory, not a file")
            
            # Read and return the file content
            with open(path, 'r', errors='replace') as f:
                content = f.read()
            
            return content
        
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
    
    async def batch_process_submissions(
        self, 
        assignment_no: int = Form(...), 
        expected_output: str = Form(...), 
        files: List[UploadFile] = File(...),
        args: Optional[str] = Form(None),
        db: Session = Depends(get_db)
    ) -> Dict:
        """
        Process multiple student submissions (zip files) for a given assignment
        """
        try:
            results = []
            
            for file in files:
                if not file.filename.endswith('.zip'):
                    continue
                
                # Extract student ID from filename (e.g., 20220602074.zip -> 20220602074)
                student_id = os.path.splitext(file.filename)[0]
                
                # Create a temporary directory for this student
                student_dir = os.path.join(self.temp_dir, student_id)
                os.makedirs(student_dir, exist_ok=True)
                
                # Save the uploaded zip file
                temp_zip_path = os.path.join(student_dir, file.filename)
                with open(temp_zip_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                try:
                    # Extract the zip file
                    with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
                        zip_ref.extractall(student_dir)
                    
                    # Find main code files
                    main_file_patterns = [
                        'main.c', 'main.cpp', 'main.java', 'main.py', 'Main.java',
                        'solution.c', 'solution.cpp', 'solution.java', 'solution.py',
                        'assignment.c', 'assignment.cpp', 'assignment.java', 'assignment.py'
                    ]
                    
                    main_file = None
                    main_file_path = None
                    
                    for pattern in main_file_patterns:
                        matches = glob.glob(os.path.join(student_dir, "**", pattern), recursive=True)
                        if matches:
                            main_file_path = matches[0]
                            main_file = os.path.basename(main_file_path)
                            break
                    
                    if not main_file:
                        results.append({
                            "student_id": student_id,
                            "status": "error",
                            "message": "No main file found in submission"
                        })
                        continue
                    
                    # Read the code file
                    with open(main_file_path, 'r', errors='replace') as f:
                        code = f.read()
                    
                    # Determine language from extension
                    extension = os.path.splitext(main_file)[1].lower()
                    if extension == '.py':
                        language = 'python'
                    elif extension == '.java':
                        language = 'java'
                    elif extension == '.cpp':
                        language = 'cpp'
                    elif extension == '.c':
                        language = 'c'
                    elif extension == '.js':
                        language = 'javascript'
                    else:
                        language = 'c'  # Default to C
                    
                    # Run the code
                    run_cmd = []
                    if language == 'python':
                        run_cmd = ["python", main_file_path]
                    elif language == 'javascript' or language == 'js':
                        run_cmd = ["node", main_file_path]
                    elif language == 'java':
                        # First compile the Java code
                        class_name = os.path.splitext(main_file)[0]
                        compile_cmd = ["javac", main_file_path]
                        compile_process = subprocess.run(
                            compile_cmd,
                            capture_output=True,
                            text=True
                        )
                        if compile_process.returncode != 0:
                            results.append({
                                "student_id": student_id,
                                "status": "error",
                                "message": f"Compilation error: {compile_process.stderr}"
                            })
                            
                            # Save failure to database
                            db_score = Score(
                                assignment_no=assignment_no,
                                student_id=int(student_id),
                                score=0  # Failed score
                            )
                            db.add(db_score)
                            db.commit()
                            
                            continue
                        
                        run_cmd = ["java", "-cp", os.path.dirname(main_file_path), class_name]
                    elif language in ['cpp', 'c++', 'c']:
                        # Compile first
                        output_path = os.path.join(student_dir, "a.out")
                        compile_cmd = ["g++", "-o", output_path, main_file_path] if language in ['cpp', 'c++'] else ["gcc", "-o", output_path, main_file_path]
                        compile_process = subprocess.run(
                            compile_cmd,
                            capture_output=True,
                            text=True
                        )
                        if compile_process.returncode != 0:
                            results.append({
                                "student_id": student_id,
                                "status": "error",
                                "message": f"Compilation error: {compile_process.stderr}"
                            })
                            
                            # Save failure to database
                            db_score = Score(
                                assignment_no=assignment_no,
                                student_id=int(student_id),
                                score=0  # Failed score
                            )
                            db.add(db_score)
                            db.commit()
                            
                            continue
                        
                        run_cmd = [output_path]
                    else:
                        results.append({
                            "student_id": student_id,
                            "status": "error",
                            "message": f"Unsupported language: {language}"
                        })
                        continue
                    
                    # Add arguments if provided
                    if args:
                        run_cmd.extend(args.split())
                    
                    # Run the code
                    process = subprocess.run(
                        run_cmd,
                        capture_output=True,
                        text=True
                    )
                    
                    if process.returncode != 0:
                        results.append({
                            "student_id": student_id,
                            "status": "error",
                            "message": "Execution failed",
                            "output": process.stderr
                        })
                        
                        # Save failure to database
                        db_score = Score(
                            assignment_no=assignment_no,
                            student_id=int(student_id),
                            score=0  # Failed score
                        )
                        db.add(db_score)
                        db.commit()
                        
                        continue
                    
                    # Compare output with expected output
                    actual_output = process.stdout.strip()
                    expected_output_trimmed = expected_output.strip()
                    
                    if actual_output == expected_output_trimmed:
                        results.append({
                            "student_id": student_id,
                            "status": "success",
                            "message": "Output matches expected result",
                            "output": actual_output
                        })
                        
                        # Get assignment details to determine percentage
                        # This assumes you have a route to get assignment details
                        from models.assignment_model import Assignment
                        assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
                        if not assignment:
                            assignment_percent = 100  # Default if assignment not found
                        else:
                            assignment_percent = assignment.assignment_percent
                        
                        # Save success to database
                        db_score = Score(
                            assignment_no=assignment_no,
                            student_id=int(student_id),
                            score=assignment_percent  # Full score
                        )
                        db.add(db_score)
                        db.commit()
                    else:
                        results.append({
                            "student_id": student_id,
                            "status": "failure",
                            "message": "Output does not match expected result",
                            "output": actual_output
                        })
                        
                        # Save failure to database
                        db_score = Score(
                            assignment_no=assignment_no,
                            student_id=int(student_id),
                            score=0  # Failed score
                        )
                        db.add(db_score)
                        db.commit()
                
                except Exception as e:
                    results.append({
                        "student_id": student_id,
                        "status": "error",
                        "message": f"Error processing submission: {str(e)}"
                    })
                    
                    try:
                        # Save error to database
                        db_score = Score(
                            assignment_no=assignment_no,
                            student_id=int(student_id),
                            score=0  # Error score
                        )
                        db.add(db_score)
                        db.commit()
                    except:
                        # If there's an error saving to the database, continue processing other students
                        pass
            
            return {"success": True, "results": results}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing submissions: {str(e)}")
    
    def _get_file_extension(self, language: str) -> str:
        extensions = {
            "python": ".py",
            "javascript": ".js",
            "js": ".js",
            "java": ".java",
            "cpp": ".cpp",
            "c++": ".cpp",
            "c": ".c"
        }
        return extensions.get(language.lower(), ".txt")