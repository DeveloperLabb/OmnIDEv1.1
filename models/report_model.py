import pandas as pd
from sqlalchemy import create_engine
from database.database import Base

class ReportModel(Base):
    def __init__(self, db_connection_string):
        self.engine = create_engine(db_connection_string)

    def fetch_student_scores(self):
        query = "SELECT student_id, score FROM student_scores"
        with self.engine.connect() as connection:
            result = pd.read_sql(query, connection)
        return result
