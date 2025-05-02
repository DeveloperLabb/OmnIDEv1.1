import os
import zipfile
import shutil
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple

SOURCE_DIRECTORY = os.path.join(os.path.dirname(os.path.dirname(__file__)), "example_files")
DEFAULT_EXTRACT_LOCATION = "defaultExtractLocation"


class ZipExtractor:
    def __init__(self, src_dir: str = SOURCE_DIRECTORY, dst_dir: str = None):

        self.src_dir = Path(src_dir)
        print(f"Source directory: {self.src_dir}")
        if dst_dir:
            self.dst_dir = Path(dst_dir)
        else:
            app_dir = Path(os.path.dirname(os.path.abspath(__file__))).parent
            self.dst_dir = app_dir / DEFAULT_EXTRACT_LOCATION
            print(f"Destination directory: {self.dst_dir}")

            # Store mappings for student IDs
        self.zip_to_student_id = {}  # Maps zip filenames to student IDs
        self.extracted_files = {}  # Maps extracted files to their source zip and student ID

    def ensure_dst_directory(self) -> None:

        if not self.dst_dir.exists():
            self.dst_dir.mkdir(parents=True, exist_ok=True)

    def get_zip_files(self) -> List[Path]:

        if not self.src_dir.exists():
            print(f"Source directory does not exist: {self.src_dir}")
            return []
        zip_files = list(self.src_dir.glob('*.zip'))
        print(f"Found zip files: {zip_files}")
        return zip_files

    def extract_student_id_from_filename(self, zip_path: Path) -> str:
        """Extract student ID from zip filename."""
        # Get the base name without the .zip extension
        filename = zip_path.stem

        # For direct student ID (when filename is the ID)
        if filename.isdigit():
            return filename

        # For filenames that might contain student ID among other text
        match = re.search(r'(\d{8,12})', filename)  # Adjust the range based on your student ID format
        if match:
            return match.group(1)

        # If we can't find a student ID pattern, just use the filename as an identifier
        return filename

    def extract_zip(self, zip_path) -> Tuple[bool, str]:
        """
        Extract a zip file and track the student ID associated with it.
        Returns a tuple of (success, student_id)
        """
        try:
            # Convert string to Path if needed
            if isinstance(zip_path, str):
                zip_path = Path(zip_path)
                if not zip_path.is_absolute():
                    zip_path = Path(self.src_dir) / zip_path

            # Extract student ID from the zip filename
            student_id = self.extract_student_id_from_filename(zip_path)
            print(f"Processing submission for student ID: {student_id} from {zip_path.name}")

            # Store the association between this zip file and the student ID
            self.zip_to_student_id[zip_path.name] = student_id

            # Create a destination directory specifically for this student
            student_dir = self.dst_dir / student_id
            student_dir.mkdir(parents=True, exist_ok=True)

            print(f"Extracting {zip_path} to: {student_dir}")

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Filter out unwanted files
                files_to_extract = [f for f in zip_ref.namelist()
                                    if not f.startswith('__MACOSX')
                                    and not f.startswith('._')]

                for file in files_to_extract:
                    # Extract the file to the student's directory
                    zip_ref.extract(file, student_dir)

                    # Record which student this file belongs to
                    extracted_path = os.path.join(student_dir, file)
                    self.extracted_files[extracted_path] = {
                        'student_id': student_id,
                        'source_zip': zip_path.name
                    }

            return (True, student_id)
        except Exception as e:
            print(f"Error extracting {zip_path}: {str(e)}")
            return (False, None)

    def extract_all(self) -> Dict[str, Dict]:
        """
        Extract all zip files in the source directory.
        Returns a dictionary mapping zip filenames to extraction results and student IDs.
        """
        self.ensure_dst_directory()
        results = {}

        for zip_file in self.get_zip_files():
            success, student_id = self.extract_zip(zip_file)
            results[zip_file.name] = {
                'success': success,
                'student_id': student_id
            }

        # Print a summary of student IDs found
        print(f"Processed {len(results)} submissions")
        print("Student ID mapping:")
        for zip_name, info in results.items():
            print(f"  {zip_name} -> Student ID: {info['student_id']}")

        return results

    def get_student_id_for_zip(self, zip_filename: str) -> Optional[str]:
        """Get the student ID associated with a zip filename."""
        return self.zip_to_student_id.get(zip_filename)

    def get_student_id_for_file(self, file_path: str) -> Optional[str]:
        """Get the student ID associated with an extracted file path."""
        file_info = self.extracted_files.get(file_path)
        if file_info:
            return file_info['student_id']
        return None

    def get_student_submissions(self) -> Dict[str, List[str]]:
        """
        Get a mapping of student IDs to their submitted files.
        Returns a dictionary where keys are student IDs and values are lists of file paths.
        """
        student_files = {}

        for file_path, info in self.extracted_files.items():
            student_id = info['student_id']
            if student_id not in student_files:
                student_files[student_id] = []
            student_files[student_id].append(file_path)

        return student_files