from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from services.report_generator import ReportGenerator
from database.database import get_db
from models.report_model import ReportModel

class ReportController:
    def __init__(self):
        self.router = APIRouter(prefix="/reports", tags=["reports"])
        self.report_generator = None
        self.report_model = None
        self._register_routes()

    def initialize(self, db_connection_string: str):
        self.report_generator = ReportGenerator(db_connection_string)
        self.report_model = ReportModel(db_connection_string)

    def _register_routes(self):
        self.router.add_api_route("/generate", self.generate_reports, methods=["POST"])
        self.router.add_api_route("/data", self.get_report_data, methods=["GET"])

    async def generate_reports(self, db: Session = Depends(get_db)):
        try:
            self.report_generator.generate_reports()
            return {"message": "Reports generated successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate reports: {str(e)}")

    async def get_report_data(self):
        try:
            data = self.report_model.fetch_student_scores()
            return data.to_dict(orient="records")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch report data: {str(e)}")
