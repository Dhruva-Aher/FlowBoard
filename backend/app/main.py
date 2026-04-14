import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.config import settings

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    application = FastAPI(
        title="FlowBoard API",
        version="1.0.0",
        description="Multi-tenant collaborative workspace API",
    )

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API v1 router
    from app.api.v1 import router as v1_router
    application.include_router(v1_router, prefix="/api/v1")

    # Include WebSocket router
    from app.websocket.handler import router as ws_router
    application.include_router(ws_router)

    @application.on_event("startup")
    async def startup_event():
        logger.info("FlowBoard API started")

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
