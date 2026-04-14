import secrets
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

# Argon2 is the Password Hashing Competition winner and has no 72-byte input
# limit.  bcrypt is kept as a deprecated fallback so any legacy hashes still
# verify on first login (passlib re-hashes them with Argon2 transparently).
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated=["bcrypt"])


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm="HS256",
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])


def create_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, hashed_token)"""
    raw = secrets.token_urlsafe(48)
    return raw, pwd_context.hash(raw)


def verify_refresh_token(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)
