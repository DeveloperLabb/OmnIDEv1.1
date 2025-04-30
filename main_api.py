import uvicorn
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from controllers.assignment_controller import AssignmentController
from controllers.score_controller import ScoreController
from controllers.report_controller import ReportController
from controllers.configuration_controller import ConfigurationController  # Add this line
from database.database import Base, engine, reset_database

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OmnIDE API")

# reset_database();
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
configuration_controller = ConfigurationController()  # Add this line

# Include routers with prefix
app.include_router(assignment_controller.router, prefix="/api")
app.include_router(score_controller.router, prefix="/api")
app.include_router(report_controller.router, prefix="/api")
app.include_router(configuration_controller.router, prefix="/api")  # Add this line

if __name__ == "__main__":
    uvicorn.run("main_api:app", host="127.0.0.1", port=8000, reload=True)