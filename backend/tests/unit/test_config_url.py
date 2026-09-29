"""Neon / Vercel DATABASE_URL normalization for asyncpg."""
from app.config import normalize_async_database_url, normalize_sync_database_url


def test_neon_url_strips_channel_binding_and_maps_sslmode():
    raw = (
        "postgresql://user:pass@ep-x.us-east-2.aws.neon.tech/neondb"
        "?sslmode=require&channel_binding=require"
    )
    out = normalize_async_database_url(raw)
    assert out.startswith("postgresql+asyncpg://")
    assert "channel_binding" not in out
    assert "sslmode" not in out
    assert "ssl=require" in out


def test_postgres_scheme_upgraded_to_asyncpg():
    out = normalize_async_database_url("postgres://u:p@localhost:5432/db")
    assert out == "postgresql+asyncpg://u:p@localhost:5432/db"


def test_sync_url_strips_asyncpg_driver():
    out = normalize_sync_database_url(
        "postgresql+asyncpg://u:p@localhost:5432/db?ssl=require"
    )
    assert out.startswith("postgresql://")
    assert "+asyncpg" not in out
