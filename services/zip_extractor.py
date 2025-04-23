import os
import zipfile
import shutil
from pathlib import Path
from typing import List


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

    def extract_zip(self, zip_path: Path) -> bool:
       
        try:
            print(f"Extracting to: {self.dst_dir}")  # Debug için

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                
                files_to_extract = [f for f in zip_ref.namelist() 
                                  if not f.startswith('__MACOSX') 
                                  and not f.startswith('._')]
                
                for file in files_to_extract:
                    zip_ref.extract(file, self.dst_dir)
            return True
        except Exception as e:
            print(f"Error extracting {zip_path}: {str(e)}")
            return False

    def extract_all(self) -> dict:
        
        self.ensure_dst_directory()
        results = {}
        
        for zip_file in self.get_zip_files():
            success = self.extract_zip(zip_file)
            results[zip_file.name] = success

        return results

