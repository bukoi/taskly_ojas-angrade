from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # 🔐 App
    APP_NAME: str = "FastAPI App"
    DEBUG: bool = True

    # 🗄️ Database
    DATABASE_URL: str

    # 🔑 JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 1

    # ⚡ Redis
    REDIS_URL: str = "redis://localhost:6379"
    ACCESS_TOKEN_TYPE: str = "Bearer"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()