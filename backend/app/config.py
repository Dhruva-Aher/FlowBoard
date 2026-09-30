"""Application settings with Vercel / Neon URL normalization."""
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_async_database_url(url: str) -> str:
    """Neon/Vercel often provide postgresql://; SQLAlchemy async needs +asyncpg.

    Also strips query params asyncpg does not accept (e.g. channel_binding)
    and maps sslmode → ssl for the asyncpg dialect.
    """
    if not url:
        return url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]

    parsed = urlparse(url)
    if not parsed.query:
        return url

    params: list[tuple[str, str]] = []
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        lower = key.lower()
        if lower == "channel_binding":
            continue
        if lower == "sslmode":
            # asyncpg expects `ssl`, not libpq's `sslmode`
            params.append(("ssl", "require" if value in ("require", "verify-full", "verify-ca") else value))
            continue
        params.append((key, value))

    return urlunparse(parsed._replace(query=urlencode(params)))


def normalize_sync_database_url(url: str) -> str:
    """Alembic / Celery sync engine — strip async driver if present."""
    if not url:
        return url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    return url.replace("postgresql+asyncpg://", "postgresql://")


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production-super-secret-key-at-least-32-chars"
    REFRESH_SECRET_KEY: str = "change-me-refresh-secret-key-at-least-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/flowboard"
    DATABASE_URL_SYNC: str = ""
    # Empty REDIS_URL → in-process NullRedis (Vercel demo without Upstash).
    REDIS_URL: str = ""
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "flowboard-uploads"
    SES_FROM_EMAIL: str = "noreply@flowboard.dev"
    FRONTEND_URL: str = "http://localhost:5173"
    # Comma-separated extra CORS origins (e.g. https://flowboard.vercel.app)
    CORS_ORIGINS: str = ""
    # Run Alembic upgrade on startup (Vercel cold start). Default off locally.
    RUN_MIGRATIONS_ON_STARTUP: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _fix_async_db(cls, v: str) -> str:
        return normalize_async_database_url(v or "")

    @property
    def sync_database_url(self) -> str:
        raw = self.DATABASE_URL_SYNC or self.DATABASE_URL
        return normalize_sync_database_url(raw)

    @property
    def cors_origin_list(self) -> list[str]:
        origins = {self.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"}
        for part in self.CORS_ORIGINS.split(","):
            part = part.strip()
            if part:
                origins.add(part)
        return sorted(origins)

    @property
    def redis_enabled(self) -> bool:
        return bool(self.REDIS_URL and self.REDIS_URL.strip())


settings = Settings()
