import sqlite3
from sqlite3 import Error
import os
from typing import Optional

class DatabaseManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance.connection = None
            cls._instance.cursor = None
        return cls._instance

    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), 'omni_ide.db')

    def connect(self) -> bool:
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.cursor = self.connection.cursor()
            self._create_tables()
            return True
        except Error as e:
            print(f"Error connecting to database: {e}")
            return False

    def _create_tables(self):
        tables = [
            """
            CREATE TABLE IF NOT EXISTS Assignment (
                AssignmentNO INTEGER PRIMARY KEY,
                AssignmentDate DATE NOT NULL,
                AssignmentPercent FLOAT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS Scores (
                AssignmentNO INTEGER,
                StudentID INTEGER,
                Score FLOAT NOT NULL,
                PRIMARY KEY (AssignmentNO, StudentID),
                FOREIGN KEY (AssignmentNO) REFERENCES Assignment(AssignmentNO)
                ON DELETE CASCADE
                ON UPDATE CASCADE
            )
            """
        ]
        
        for table in tables:
            try:
                self.cursor.execute(table)
                self.connection.commit()
            except Error as e:
                print(f"Error creating table: {e}")

    def close(self):
        if self.connection:
            self.connection.close()

    def execute_query(self, query: str, params: tuple = ()) -> Optional[list]:
        try:
            self.cursor.execute(query, params)
            self.connection.commit()
            return self.cursor.fetchall()
        except Error as e:
            print(f"Error executing query: {e}")
            return None