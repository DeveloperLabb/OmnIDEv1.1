#!/usr/bin/env python3
"""
Test script to verify student ID extraction from zip filenames.
This script shows both direct file scanning and zip extraction approaches.
"""

import os
import sys
import json
from pathlib import Path

# Add the parent directory to sys.path to import our modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from services.zip_extractor import ZipExtractor



def test_scan_directory(submissions_dir):
    """Scan a directory of zip files without extracting them."""
    print(f"\n=== Scanning directory {submissions_dir} without extraction ===\n")

    extractor = StudentIDExtractor(submissions_dir)
    mapping = extractor.generate_report()

    print("\nStudent ID Mappings (without extraction):")
    for zip_name, student_id in mapping.items():
        print(f"  {zip_name} -> {student_id}")

    return mapping


def test_extract_files(submissions_dir, extract_dir):
    """Extract zip files and track student IDs."""
    print(f"\n=== Extracting files from {submissions_dir} to {extract_dir} ===\n")

    # Create the extraction directory if it doesn't exist
    os.makedirs(extract_dir, exist_ok=True)

    # Initialize the ZipExtractor
    extractor = ZipExtractor(submissions_dir, extract_dir)

    # Extract all zip files
    results = extractor.extract_all()

    print("\nExtraction Results:")
    for zip_name, info in results.items():
        success_str = "success" if info['success'] else "failed"
        print(f"  {zip_name} -> {success_str}, Student ID: {info['student_id']}")

    # Get the student submissions mapping
    student_submissions = extractor.get_student_submissions()

    print("\nStudent Submissions:")
    for student_id, files in student_submissions.items():
        file_names = [os.path.basename(f) for f in files]
        print(f"  Student {student_id}: {len(file_names)} files - {', '.join(file_names[:3])}" +
              (f" and {len(file_names) - 3} more..." if len(file_names) > 3 else ""))

    # Save the mappings to a JSON file
    mapping_file = os.path.join(extract_dir, "student_mappings.json")
    with open(mapping_file, 'w') as f:
        json.dump({
            'zip_to_student_id': {zip_name: info['student_id'] for zip_name, info in results.items() if
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

    print(f"\nMappings saved to {mapping_file}")

    return results


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <submissions_directory> [extract_directory]")
        sys.exit(1)

    # Get the submissions directory from command line arguments
    submissions_dir = sys.argv[1]

    # Get the extract directory from command line arguments or use a default
    extract_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(parent_dir, "defaultExtractLocation",
                                                                     "test_extraction")

    # Verify the submissions directory exists
    if not os.path.exists(submissions_dir):
        print(f"Error: Submissions directory {submissions_dir} does not exist")
        sys.exit(1)

    # Test scanning the directory without extraction
    scan_mapping = test_scan_directory(submissions_dir)

    # Test extracting files
    extract_results = test_extract_files(submissions_dir, extract_dir)

    # Compare the results
    scan_count = len(scan_mapping)
    extract_count = len(extract_results)
    extract_success = sum(1 for info in extract_results.values() if info['success'])

    print("\n=== Summary ===")
    print(f"  Found {scan_count} zip files by scanning")
    print(f"  Processed {extract_count} zip files for extraction")
    print(f"  Successfully extracted {extract_success} zip files")

    # Check if all files were mapped to student IDs
    all_mapped = all(student_id is not None for student_id in scan_mapping.values())
    print(f"  All files mapped to student IDs: {'Yes' if all_mapped else 'No'}")

    print(f"\nResults have been saved to {extract_dir}")


if __name__ == "__main__":
    main()