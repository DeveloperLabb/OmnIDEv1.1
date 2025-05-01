import uvicorn
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from controllers.assignment_controller import AssignmentController
from controllers.score_controller import ScoreController
from controllers.report_controller import ReportController
from controllers.code_runner_controller import CodeRunnerController
from database.database import Base, engine, ensure_tables, reset_database
import logging
from controllers.configuration_controller import ConfigurationController  # Add this line
from database.database import Base, engine, reset_database

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Starting OmnIDE API")

# Ensure database tables exist (creates if don't exist)
ensure_tables()

app = FastAPI(title="OmnIDE API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add root endpoint that allows HEAD requests
@app.get("/")
@app.head("/")
async def root():
    return {"status": "ok"}

# Initialize controllers
assignment_controller = AssignmentController()
score_controller = ScoreController()
report_controller = ReportController()
code_runner_controller = CodeRunnerController()
configuration_controller = ConfigurationController()  # Add this line

# Include routers with prefix
app.include_router(assignment_controller.router, prefix="/api")
app.include_router(score_controller.router, prefix="/api")
app.include_router(report_controller.router, prefix="/api")
app.include_router(code_runner_controller.router, prefix="/api")

# Add a utility endpoint to reset the database (for development/testing)
@app.post("/api/reset-database")
async def reset_db():
    logger.warning("Resetting database - this will delete all data")
    reset_database()
    return {"status": "Database reset successfully"}
app.include_router(configuration_controller.router, prefix="/api")  # Add this line

if __name__ == "__main__":
    logger.info("Starting uvicorn server")
    uvicorn.run("main_api:app", host="127.0.0.1", port=8000, reload=True)