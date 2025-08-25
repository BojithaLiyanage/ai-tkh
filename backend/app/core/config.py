# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-TKH"
    DATABASE_URL: str
    SECRET_KEY: str = "your-secret-key-change-in-production"
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"
    ENV: str = "local"
    API_V1_STR: str = "/api"

    model_config = SettingsConfigDict(
        env_file = (
            ".env.local" if Path(".env.local").exists() else ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
