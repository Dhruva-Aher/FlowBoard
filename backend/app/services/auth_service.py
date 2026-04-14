from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import redis.asyncio as aioredis

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.core.exceptions import ConflictException, CredentialsException
from app.crud import user as user_crud
from app.models.user import User
from app.models.auth import RefreshToken
from app.config import settings
from app.core.utils import utcnow


async def register(
    db: AsyncSession,
    redis: aioredis.Redis,
    email: str,
    name: str,
    password: str,
) -> tuple[User, str, str]:
    existing = await user_crud.get_by_email(db, email)
    if existing:
        raise ConflictException("A user with this email already exists")

    password_hash = hash_password(password)
    user = await user_crud.create(db, email=email, name=name, password_hash=password_hash)

    access_token = create_access_token(str(user.id))
    raw_refresh, hashed_refresh = create_refresh_token()

    expires_at = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=expires_at,
    )
    db.add(refresh_token_record)
    await db.flush()

    return user, access_token, raw_refresh


async def login(
    db: AsyncSession,
    email: str,
    password: str,
) -> tuple[User, str, str]:
    user = await user_crud.get_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise CredentialsException()

    if not user.is_active:
        raise CredentialsException()

    access_token = create_access_token(str(user.id))
    raw_refresh, hashed_refresh = create_refresh_token()

    expires_at = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=expires_at,
    )
    db.add(refresh_token_record)
    await db.flush()

    return user, access_token, raw_refresh


async def refresh(
    db: AsyncSession,
    user_id: UUID,
    raw_token: str,
) -> tuple[str, str]:
    now = utcnow()

    # Find all valid (unexpired, unrevoked) refresh tokens for this user
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > now,
        )
    )
    valid_tokens = list(result.scalars().all())

    matching_token: RefreshToken | None = None
    for rt in valid_tokens:
        if verify_refresh_token(raw_token, rt.token_hash):
            matching_token = rt
            break

    if not matching_token:
        raise CredentialsException()

    # Revoke old token
    matching_token.revoked = True
    await db.flush()

    # Issue new pair
    new_access = create_access_token(str(user_id))
    new_raw_refresh, new_hashed_refresh = create_refresh_token()

    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_record = RefreshToken(
        user_id=user_id,
        token_hash=new_hashed_refresh,
        expires_at=expires_at,
    )
    db.add(new_record)
    await db.flush()

    return new_access, new_raw_refresh


async def logout(
    db: AsyncSession,
    user_id: UUID,
    raw_token: str,
) -> None:
    now = utcnow()
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > now,
        )
    )
    valid_tokens = list(result.scalars().all())

    for rt in valid_tokens:
        if verify_refresh_token(raw_token, rt.token_hash):
            rt.revoked = True
            await db.flush()
            return
