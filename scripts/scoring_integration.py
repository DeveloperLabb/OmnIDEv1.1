#!/usr/bin/env python3
"""
Integration script to process student submissions and update scores based on zip filenames.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any

# Add the parent directory to sys.path to import our modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from database.database import get_db, SessionLocal
from models.assignment_model import Assignment
from models.score_model import Score
from services.zip_extractor import ZipExtractor
from services.evaluation_service import EvaluationService



def process_submissions(assignment_no: int, submissions_dir: str, extract_dir: str = None, overwrite: bool = False):
    """
    Process student submissions for an assignment.

    Args:
        assignment_no: The assignment number to process
        submissions_dir: Directory containing the student submission zip files
        extract_dir: Directory to extract submissions to (optional)
        overwrite: Whether to overwrite existing files in the extract directory
    """
    # Get the database session
    db = SessionLocal()

    try:
        # Get the assignment
        assignment = db.query(Assignment).filter(Assignment.assignment_no == assignment_no).first()
        if not assignment:
            print(f"Error: Assignment {assignment_no} not found")
            return

        print(f"Processing submissions for Assignment: {assignment.assignment_name}")

        # Determine the extraction directory
        if not extract_dir:
            app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            base_extract_dir = os.path.join(app_dir, "defaultExtractLocation")
            extract_dir = os.path.join(base_extract_dir, assignment.assignment_name, "student_submissions")

        # Create the extraction directory if it doesn't exist
        os.makedirs(extract_dir, exist_ok=True)

        # Check if the directory is empty or if overwrite is enabled
        existing_files = os.listdir(extract_dir)
        if existing_files and not overwrite:
            print(f"Warning: Extract directory {extract_dir} is not empty.")
            response = input("Do you want to continue and overwrite existing files? (y/n): ")
            if response.lower() != 'y':
                print("Aborting...")
                return

        print(f"Scanning directory: {submissions_dir}")
        print(f"Extracting to: {extract_dir}")

        # Initialize the ZipExtractor
        extractor = ZipExtractor(src_dir=submissions_dir, dst_dir=extract_dir)

        # Extract all zip files
        extraction_results = extractor.extract_all()

        # Get the student submissions mapping
        student_submissions = extractor.get_student_submissions()

        # Print the results
        print(f"\nExtracted {len(extraction_results)} submissions")
        print(f"Found {len(student_submissions)} student submissions")

        # Save the mappings to a JSON file
        mapping_file = os.path.join(os.path.dirname(extract_dir), "student_mappings.json")
        with open(mapping_file, 'w') as f:
            json.dump({
                'zip_to_student_id': {zip_name: info['student_id'] for zip_name, info in extraction_results.items() if
                                      info['success']},
                'student_data': {
                    student_id: {
                        'student_id': student_id,
                        'file_count': len(files),
                        'files': [os.path.basename(f) for f in files]
                    }
                    for student_id, files in student_submissions.items()
                }
            }, f, indent=2)

        print(f"Mappings saved to {mapping_file}")

        # Evaluate the submissions
        evaluation_service = EvaluationService(db)
        evaluation_results = evaluation_service.evaluate_specific_assignment(assignment_no, os.path.dirname(
            os.path.dirname(extract_dir)))

        # Print the evaluation results
        print(f"\nEvaluation Results:")
        print(f"{'Student ID':<15} {'Score':<10} {'Matched':<10}")
        print("-" * 40)

        for result in evaluation_results:
            print(f"{result['student_id']:<15} {result['score']:<10.2f} {result['matched']}")

        # Print a summary
        total_submissions = len(evaluation_results)
        matched_submissions = sum(1 for r in evaluation_results if r['matched'])

        print(f"\nSummary:")
        print(f"  Total submissions: {total_submissions}")
        print(f"  Correct submissions: {matched_submissions}")
        print(
            f"  Success rate: {matched_submissions / total_submissions * 100:.2f}% if total_submissions > 0 else 'N/A'")

        # Return the evaluation results
        return evaluation_results

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Process student submissions for an assignment')
    parser.add_argument('assignment_no', type=int, help='Assignment number to process')
    parser.add_argument('submissions_dir', help='Directory containing the student submission zip files')
    parser.add_argument('--extract-dir', help='Directory to extract submissions to (optional)')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing files in the extract directory')

    args = parser.parse_args()

    process_submissions(args.assignment_no, args.submissions_dir, args.extract_dir, args.overwrite)


if __name__ == "__main__":
    main()