from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from database.database import Base

class Configuration(Base):
    __tablename__ = "Configuration"

    config_id = Column("ConfigID", Integer, primary_key=True, autoincrement=True)
    language_name = Column("LanguageName", String, nullable=False)
    path = Column("Path", String, nullable=False)

class ConfigurationResponse(BaseModel):
    config_id: int
    language_name: str
    path: str

    class Config:
        from_attributes = True