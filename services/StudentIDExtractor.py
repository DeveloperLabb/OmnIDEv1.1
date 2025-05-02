import os
import re
import json
from pathlib import Path
from typing import Dict, List, Optional


class StudentIDExtractor:
    """
    Utility class to scan a directory of zip files and extract student IDs from filenames.
    This can be used to generate a mapping of zip files to student IDs without extracting the files.
    """

    def __init__(self, submissions_dir: str):
        """
        Initialize with the directory containing student submission ZIP files.

        Args:
            submissions_dir: Path to the directory containing student submission ZIP files
        """
        self.submissions_dir = Path(submissions_dir)
        self.student_id_pattern = re.compile(r'(\d{8,12})')  # Adjust this regex as needed for your student ID format

    def extract_student_id_from_filename(self, filename: str) -> Optional[str]:
        """
        Extract student ID from a filename.

        Args:
            filename: Filename (with or without extension)

        Returns:
            Student ID or None if not found
        """
        # Remove extension if present
        base_name = os.path.splitext(filename)[0]

        # If the filename is purely digits, it's likely a student ID
        if base_name.isdigit():
            return base_name

        # Otherwise, try to extract a pattern that looks like a student ID
        match = self.student_id_pattern.search(base_name)
        if match:
            return match.group(1)

        # If no pattern found, return None
        return None

    def scan_directory(self) -> Dict[str, str]:
        """
        Scan the directory for ZIP files and extract student IDs from filenames.

        Returns:
            Dictionary mapping ZIP filenames to student IDs
        """
        if not self.submissions_dir.exists():
            print(f"Directory does not exist: {self.submissions_dir}")
            return {}

        # Find all ZIP files in the directory
        zip_files = list(self.submissions_dir.glob('*.zip'))

        # Map filenames to student IDs
        mapping = {}
        for zip_file in zip_files:
            student_id = self.extract_student_id_from_filename(zip_file.name)
            if student_id:
                mapping[zip_file.name] = student_id
                print(f"File '{zip_file.name}' mapped to student ID: {student_id}")
            else:
                print(f"Could not extract student ID from file: {zip_file.name}")

        return mapping

    def generate_report(self, output_file: Optional[str] = None) -> Dict[str, str]:
        """
        Generate a report of the student ID mappings.

        Args:
            output_file: Path to save the report to (optional)

        Returns:
            Dictionary mapping ZIP filenames to student IDs
        """
        mapping = self.scan_directory()

        # Summarize the mapping
        print(f"\nFound {len(mapping)} ZIP files with student IDs")

        # Save the report if an output file is specified
        if output_file:
            with open(output_file, 'w') as f:
                json.dump({
                    'zip_to_student_id': mapping,
                    'total_count': len(mapping)
                }, f, indent=2)
            print(f"Report saved to {output_file}")

        return mapping


# Example usage:
if __name__ == "__main__":
    # Replace with your submissions directory
    extractor = StudentIDExtractor("/path/to/student_submissions")
    mapping = extractor.generate_report("student_id_mappings.json")

    # Print some examples
    for i, (zip_name, student_id) in enumerate(mapping.items()):
        if i >= 5:  # Show just first 5 examples
            break
        print(f"{zip_name} -> {student_id}")