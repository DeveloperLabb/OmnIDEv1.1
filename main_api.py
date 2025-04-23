import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.assignment_controller import AssignmentController
from controllers.score_controller import ScoreController
from database.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OmnIDE API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize controllers
assignment_controller = AssignmentController()
score_controller = ScoreController()

# Include routers
app.include_router(assignment_controller.router)
app.include_router(score_controller.router)

if __name__ == "__main__":
    uvicorn.run("main_api:app", host="127.0.0.1", port=8000, reload=True)