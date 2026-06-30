from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ManejARG API"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    supabase_url: str = Field(default="http://127.0.0.1:54321", alias="SUPABASE_URL")
    supabase_service_key: str = Field(default="test-service-key", alias="SUPABASE_SERVICE_KEY")
    supabase_jwt_secret: str | None = Field(default=None, alias="SUPABASE_JWT_SECRET")


@lru_cache
def get_settings() -> Settings:
    return Settings()
