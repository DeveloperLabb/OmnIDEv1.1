import uvicorn
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from controllers.assignment_controller import AssignmentController
from controllers.score_controller import ScoreController
from controllers.report_controller import ReportController
from controllers.configuration_controller import ConfigurationController
from controllers.application_feature_controller import ApplicationFeatureController

from database.database import Base, engine, reset_database

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OmnIDE API")

# Modified CORS configuration to allow requests from all origins when packaged
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the packaged app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add root endpoint that allows HEAD requests
@app.get("/")
@app.head("/")
async def root():
    return {"message": "OmnIDE API is running"}

# Add health-check endpoint
@app.get("/api/health-check")
async def health_check():
    """Simple endpoint to check if the API is running"""
    return {"status": "ok"}

# Initialize controllers
assignment_controller = AssignmentController()
score_controller = ScoreController()
report_controller = ReportController()
configuration_controller = ConfigurationController()
application_feature_controller = ApplicationFeatureController()

# Include routers with prefix
app.include_router(assignment_controller.router, prefix="/api")
app.include_router(score_controller.router, prefix="/api")
app.include_router(report_controller.router, prefix="/api")
app.include_router(configuration_controller.router, prefix="/api")
app.include_router(application_feature_controller.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)

    # uvicorn.run("main_api:app", host="127.0.0.1", port=8000, reload=True) for dev server
    # pyinstaller omniide.spec for production build.