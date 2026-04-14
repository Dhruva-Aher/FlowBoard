import pytest
from freezegun import freeze_time
from datetime import timedelta, datetime, timezone
from jose import JWTError
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
    verify_refresh_token,
)


def test_password_hash_and_verify():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed)
    assert not verify_password("wrong", hashed)


def test_password_beyond_72_bytes_hashes_correctly():
    """Argon2 must handle passwords longer than bcrypt's 72-byte limit."""
    long_pw = "a" * 100  # 100 bytes — would crash bcrypt
    hashed = hash_password(long_pw)
    assert verify_password(long_pw, hashed)
    assert not verify_password("a" * 99, hashed)


def test_two_different_long_passwords_do_not_collide():
    """Distinct long passwords must produce non-matching hashes (no truncation)."""
    pw_a = "correct-horse-battery-staple" * 4   # 112 bytes
    pw_b = pw_a[:-1] + "X"                       # differs only in last char
    hash_a = hash_password(pw_a)
    assert not verify_password(pw_b, hash_a), (
        "Hash collision: hashing scheme is silently truncating long passwords"
    )


def test_access_token_decode():
    token = create_access_token("user-123")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_access_token_expired():
    token = create_access_token("user-123")
    # Freeze time 20 minutes in the future (token expires in 15 min)
    future = datetime.now(timezone.utc) + timedelta(minutes=20)
    with freeze_time(future):
        with pytest.raises(JWTError):
            decode_access_token(token)


def test_refresh_token_verify():
    raw, hashed = create_refresh_token()
    assert verify_refresh_token(raw, hashed)
    assert not verify_refresh_token("wrong", hashed)


def test_refresh_tokens_are_unique():
    raw1, _ = create_refresh_token()
    raw2, _ = create_refresh_token()
    assert raw1 != raw2
