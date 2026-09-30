import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


async def _ensure_schema() -> None:
    """Create tables if missing (Vercel cold start without a separate migrate job)."""
    from app.database import Base, engine
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema ensured (create_all)")


@asynccontextmanager
async def lifespan(application: FastAPI):
    if settings.RUN_MIGRATIONS_ON_STARTUP:
        try:
            await _ensure_schema()
        except Exception:
            logger.exception("Startup schema ensure failed")
            raise
    logger.info(
        "FlowBoard API started env=%s redis=%s",
        settings.ENVIRONMENT,
        "enabled" if settings.redis_enabled else "null",
    )
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="FlowBoard API",
        version="1.0.0",
        description="Multi-tenant collaborative workspace API",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.api.v1 import router as v1_router

    application.include_router(v1_router, prefix="/api/v1")

    from app.websocket.handler import router as ws_router

    application.include_router(ws_router)

    @application.get("/health")
    async def health():
        return {
            "status": "ok",
            "environment": settings.ENVIRONMENT,
            "redis": "enabled" if settings.redis_enabled else "null",
        }

    @application.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail)},
            headers=getattr(exc, "headers", None),
        )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # exc.errors() can contain non-JSON-serialisable types (e.g. raw bytes
        # in the `input` field when a non-JSON body is sent to a JSON endpoint).
        # jsonable_encoder converts them to safe Python primitives before
        # json.dumps() is called, preventing the TypeError → 500 cascade.
        # exc.body is intentionally omitted: it may contain raw passwords.
        return JSONResponse(
            status_code=422,
            content=jsonable_encoder({"detail": exc.errors()}),
        )

    return application


app = create_app()
