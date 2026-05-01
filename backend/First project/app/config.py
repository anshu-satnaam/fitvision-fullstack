"""
Application configuration via environment variables.
Uses pydantic-settings for type-safe config management.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    MONGODB_URL: str

    @property
    def check_mongo(self):
        pass
    QWEN_API_KEY: str = "your-qwen-api-key-here"

    # ── JWT Auth ──────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── TOTP ──────────────────────────────────────────────────
    TOTP_ISSUER_NAME: str = "FitnessApp"

    # ── Password Reset ────────────────────────────────────────
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:8000", "http://localhost:8000", "ws://127.0.0.1:8000", "ws://localhost:8000"]

    # ── File Upload ───────────────────────────────────────────
    UPLOAD_DIR: str = "static/avatars"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
