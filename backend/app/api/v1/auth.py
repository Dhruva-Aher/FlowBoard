from fastapi import APIRouter, Depends, Response, Cookie, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.redis import get_redis
from app.api.deps import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)
from app.schemas.common import MessageResponse
from app.services import auth_service
from app.models.user import User
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    user, access_token, raw_refresh = await auth_service.register(
        db, redis, email=body.email, name=body.name, password=body.password
    )
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT != "development",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )
    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    # OAuth2PasswordRequestForm uses `username` as the field name; we treat it
    # as the user's email address, matching the registration schema.
    user, access_token, raw_refresh = await auth_service.login(
        db, email=form_data.username, password=form_data.password
    )
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT != "development",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    body: RefreshRequest | None = None,
    refresh_token_cookie: str | None = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    raw_token = None
    if body and body.refresh_token:
        raw_token = body.refresh_token
    elif refresh_token_cookie:
        raw_token = refresh_token_cookie

    if not raw_token:
        raise HTTPException(status_code=400, detail="No refresh token provided")

    new_access, new_raw_refresh = await auth_service.refresh(db, current_user.id, raw_token)

    response.set_cookie(
        key="refresh_token",
        value=new_raw_refresh,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT != "development",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )
    return TokenResponse(access_token=new_access)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    body: RefreshRequest | None = None,
    refresh_token_cookie: str | None = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_token = None
    if body and body.refresh_token:
        raw_token = body.refresh_token
    elif refresh_token_cookie:
        raw_token = refresh_token_cookie

    if raw_token:
        await auth_service.logout(db, current_user.id, raw_token)

    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
    )
