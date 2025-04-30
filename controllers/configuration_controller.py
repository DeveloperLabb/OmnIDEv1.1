from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.configuration_model import Configuration, ConfigurationResponse
from database.database import get_db
from pydantic import BaseModel

class ConfigurationCreate(BaseModel):
    language_name: str
    path: str

class ConfigurationController:
    def __init__(self):
        self.router = APIRouter(prefix="/configurations", tags=["configurations"])
        self._register_routes()

    def _register_routes(self):
        self.router.add_api_route("/", self.create_configuration, methods=["POST"], response_model=ConfigurationResponse)
        self.router.add_api_route("/{config_id}", self.get_configuration, methods=["GET"], response_model=ConfigurationResponse)
        self.router.add_api_route("/", self.get_all_configurations, methods=["GET"], response_model=List[ConfigurationResponse])
        self.router.add_api_route("/{config_id}", self.update_configuration, methods=["PUT"], response_model=ConfigurationResponse)
        self.router.add_api_route("/{config_id}", self.delete_configuration, methods=["DELETE"])
        self.router.add_api_route("/language/{language_name}", self.get_by_language, methods=["GET"], response_model=ConfigurationResponse)

    async def create_configuration(self, config: ConfigurationCreate, db: Session = Depends(get_db)) -> Configuration:
        db_config = Configuration(
            language_name=config.language_name,
            path=config.path
        )
        try:
            db.add(db_config)
            db.commit()
            db.refresh(db_config)
            return db_config
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def get_configuration(self, config_id: int, db: Session = Depends(get_db)) -> Configuration:
        db_config = db.query(Configuration).filter(Configuration.config_id == config_id).first()
        if not db_config:
            raise HTTPException(status_code=404, detail=f"Configuration with ID {config_id} not found")
        return db_config

    async def get_all_configurations(self, db: Session = Depends(get_db)) -> List[Configuration]:
        return db.query(Configuration).all()

    async def update_configuration(self, config_id: int, config: ConfigurationCreate, db: Session = Depends(get_db)) -> Configuration:
        db_config = db.query(Configuration).filter(Configuration.config_id == config_id).first()
        if not db_config:
            raise HTTPException(status_code=404, detail=f"Configuration with ID {config_id} not found")
        
        db_config.language_name = config.language_name
        db_config.path = config.path
        
        try:
            db.commit()
            db.refresh(db_config)
            return db_config
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def delete_configuration(self, config_id: int, db: Session = Depends(get_db)):
        db_config = db.query(Configuration).filter(Configuration.config_id == config_id).first()
        if not db_config:
            raise HTTPException(status_code=404, detail=f"Configuration with ID {config_id} not found")
        
        try:
            db.delete(db_config)
            db.commit()
            return {"message": f"Configuration with ID {config_id} deleted successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def get_by_language(self, language_name: str, db: Session = Depends(get_db)) -> Configuration:
        db_config = db.query(Configuration).filter(Configuration.language_name == language_name).first()
        if not db_config:
            raise HTTPException(status_code=404, detail=f"Configuration for language '{language_name}' not found")
        return db_config