from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging
import sqlite3

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the absolute path to the database file
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, 'omni_ide.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

logger.info(f"Database location: {DB_FILE}")

# Create the engine with echo=True for debugging
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=True  # This will log all SQL operations
)

# Enable foreign keys for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def reset_database():
    """Reset database tables - use with caution"""
    try:
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database reset completed successfully")
        
        # Create a session to add some initial data if needed
        db = SessionLocal()
        try:
            # You can add initial data here if needed
            from models.assignment_model import Assignment
            from datetime import date
            
            # Add a sample assignment
            initial_assignment = Assignment(
                assignment_name="Sample Assignment",
                assignment_date=date.today(),
                assignment_percent=100.0,
                correct_output="Hello, World!",
                args=""
            )
            db.add(initial_assignment)
            db.commit()
            logger.info(f"Added sample assignment: {initial_assignment.assignment_name}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding initial data: {str(e)}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")

# Ensure database tables exist
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging
import sqlite3
import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the absolute path to the database file
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, 'omni_ide.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

logger.info(f"Database location: {DB_FILE}")

# Create the engine with echo=True for debugging
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=True  # This will log all SQL operations
)

# Enable foreign keys for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modified function to always add sample data
def ensure_tables():
    """Ensure database tables exist and add sample data if needed"""
    try:
        # Always create tables to ensure they match models
        Base.metadata.create_all(bind=engine)
        logger.info("Ensured all tables exist in the database")
        
        # Check if we have any assignments at all
        db = SessionLocal()
        try:
            from models.assignment_model import Assignment
            
            # Count assignments
            assignment_count = db.query(Assignment).count()
            
            # If no assignments, add sample data
            if assignment_count == 0:
                logger.info("No assignments found. Adding sample data...")
                
                # Add sample assignments
                assignments = [
                    Assignment(
                        assignment_name="C Programming Assignment",
                        assignment_date=datetime.date.today(),
                        assignment_percent=100.0,
                        correct_output="Hello, World!",
                        args=""
                    ),
                    Assignment(
                        assignment_name="Python Assignment",
                        assignment_date=datetime.date.today(),
                        assignment_percent=80.0,
                        correct_output="Hello from Python!",
                        args="--verbose"
                    ),
                    Assignment(
                        assignment_name="Java Assignment",
                        assignment_date=datetime.date.today(),
                        assignment_percent=90.0,
                        correct_output="Java output",
                        args="-jar"
                    )
                ]
                
                # Add all assignments to the session
                for assignment in assignments:
                    db.add(assignment)
                
                # Commit changes
                db.commit()
                logger.info(f"Added {len(assignments)} sample assignments")
            else:
                logger.info(f"Found {assignment_count} existing assignments")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding sample data: {str(e)}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error ensuring tables: {str(e)}")

def reset_database():
    """Reset database tables - use with caution"""
    try:
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database reset completed successfully")
        
        # Add sample data after reset
        db = SessionLocal()
        try:
            from models.assignment_model import Assignment
            
            # Add sample assignments
            assignments = [
                Assignment(
                    assignment_name="C Programming Assignment",
                    assignment_date=datetime.date.today(),
                    assignment_percent=100.0,
                    correct_output="Hello, World!",
                    args=""
                ),
                Assignment(
                    assignment_name="Python Assignment",
                    assignment_date=datetime.date.today(),
                    assignment_percent=80.0,
                    correct_output="Hello from Python!",
                    args="--verbose"
                ),
                Assignment(
                    assignment_name="Java Assignment",
                    assignment_date=datetime.date.today(),
                    assignment_percent=90.0,
                    correct_output="Java output",
                    args="-jar"
                )
            ]
            
            # Add all assignments to the session
            for assignment in assignments:
                db.add(assignment)
            
            # Commit changes
            db.commit()
            logger.info(f"Added {len(assignments)} sample assignments")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding initial data: {str(e)}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")