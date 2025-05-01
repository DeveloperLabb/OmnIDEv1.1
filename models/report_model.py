import pandas as pd
from sqlalchemy import create_engine, text
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportModel:
    def __init__(self, db_connection_string):
        self.engine = create_engine(db_connection_string)
        logger.info(f"Report model initialized with connection: {db_connection_string}")

    def fetch_student_scores(self):
        """Fetch all student scores with assignment details"""
        try:
            # Updated query to join with Assignment table to get assignment names
            query = """
            SELECT 
                s.StudentID as student_id, 
                s.Score as score, 
                s.AssignmentNO as assignment_no,
                a.AssignmentName as assignment_name,
                a.AssignmentDate as assignment_date,
                a.AssignmentPercent as assignment_percent
            FROM 
                Scores s
            JOIN 
                Assignment a ON s.AssignmentNO = a.AssignmentNO
            ORDER BY 
                s.StudentID, s.AssignmentNO
            """
            
            logger.info("Executing query to fetch student scores")
            with self.engine.connect() as connection:
                result = pd.read_sql(text(query), connection)
            
            logger.info(f"Fetched {len(result)} student score records")
            return result
        except Exception as e:
            logger.error(f"Error fetching student scores: {str(e)}")
            # Return empty DataFrame if there's an error
            return pd.DataFrame(columns=['student_id', 'score', 'assignment_no', 'assignment_name', 'assignment_date'])
    
    def fetch_assignment_statistics(self):
        """Fetch statistics for each assignment"""
        try:
            query = """
            SELECT 
                a.AssignmentNO as assignment_no,
                a.AssignmentName as assignment_name,
                COUNT(s.StudentID) as total_submissions,
                AVG(s.Score) as average_score,
                SUM(CASE WHEN s.Score > 0 THEN 1 ELSE 0 END) as passed_count,
                SUM(CASE WHEN s.Score = 0 THEN 1 ELSE 0 END) as failed_count
            FROM 
                Assignment a
            LEFT JOIN 
                Scores s ON a.AssignmentNO = s.AssignmentNO
            GROUP BY 
                a.AssignmentNO, a.AssignmentName
            ORDER BY 
                a.AssignmentNO
            """
            
            logger.info("Executing query to fetch assignment statistics")
            with self.engine.connect() as connection:
                result = pd.read_sql(text(query), connection)
            
            logger.info(f"Fetched statistics for {len(result)} assignments")
            return result
        except Exception as e:
            logger.error(f"Error fetching assignment statistics: {str(e)}")
            return pd.DataFrame(columns=['assignment_no', 'assignment_name', 'total_submissions', 'average_score', 'passed_count', 'failed_count'])
    
    def fetch_student_summary(self):
        """Fetch summary of student performance across all assignments"""
        try:
            query = """
            SELECT 
                s.StudentID as student_id,
                COUNT(s.AssignmentNO) as total_assignments,
                SUM(s.Score) as total_score,
                AVG(s.Score) as average_score,
                SUM(CASE WHEN s.Score > 0 THEN 1 ELSE 0 END) as assignments_passed,
                SUM(CASE WHEN s.Score = 0 THEN 1 ELSE 0 END) as assignments_failed
            FROM 
                Scores s
            GROUP BY 
                s.StudentID
            ORDER BY 
                s.StudentID
            """
            
            logger.info("Executing query to fetch student summary")
            with self.engine.connect() as connection:
                result = pd.read_sql(text(query), connection)
            
            logger.info(f"Fetched summary for {len(result)} students")
            return result
        except Exception as e:
            logger.error(f"Error fetching student summary: {str(e)}")
            return pd.DataFrame(columns=['student_id', 'total_assignments', 'total_score', 'average_score', 'assignments_passed', 'assignments_failed'])