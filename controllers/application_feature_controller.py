from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response
from sqlalchemy.orm import Session
from database.database import get_db
from services.application_feature_service import ApplicationFeatureService
import json

class ApplicationFeatureController:
    def __init__(self):
        self.router = APIRouter(prefix="/features", tags=["features"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/export", self.export_data, methods=["GET"])
        self.router.add_api_route("/import", self.import_data, methods=["POST"])

    async def export_data(self, db: Session = Depends(get_db)):
        """Export all application data as a JSON file."""
        try:
            # Call service to get export data
            export_data = await ApplicationFeatureService.export_data(db)
            
            # Return as JSON response with appropriate headers
            return Response(
                content=json.dumps(export_data, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=omniide_export.json"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

    async def import_data(self, file: UploadFile = File(...), db: Session = Depends(get_db)):
        """Import application data from a JSON file."""
        try:
            # Read the uploaded file
            content = await file.read()
            data = json.loads(content)

            # Call service to import data
            await ApplicationFeatureService.import_data(data, db)
            return {"message": "Import completed successfully"}
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")