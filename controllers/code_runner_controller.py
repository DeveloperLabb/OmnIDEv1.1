from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database.database import get_db
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import tempfile
import zipfile
import subprocess
import shutil
from typing import Dict, Optional, List
from fastapi.responses import JSONResponse

class CompileRequest(BaseModel):
    code: str
    language: str
    args: Optional[str] = None

class RunRequest(BaseModel):
    code: str
    language: str
    input_data: Optional[str] = None
    args: Optional[str] = None

class CodeRunnerController:
    def __init__(self):
        self.router = APIRouter(prefix="/code", tags=["code"])
        self._register_routes()
        self.temp_dir = tempfile.mkdtemp()
        
    def _register_routes(self):
        self.router.add_api_route("/compile", self.compile_code, methods=["POST"])
        self.router.add_api_route("/run", self.run_code, methods=["POST"])
        self.router.add_api_route("/extract", self.extract_zip, methods=["POST"])

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