from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production-super-secret-key-at-least-32-chars"
    REFRESH_SECRET_KEY: str = "change-me-refresh-secret-key-at-least-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/flowboard"
    DATABASE_URL_SYNC: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "flowboard-uploads"
    SES_FROM_EMAIL: str = "noreply@flowboard.dev"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
