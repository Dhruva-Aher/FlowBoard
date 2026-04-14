from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return the current UTC time as a naive datetime (no tzinfo).

    SQLAlchemy maps ``Mapped[datetime]`` to ``TIMESTAMP WITHOUT TIME ZONE``.
    asyncpg rejects timezone-aware datetimes for that column type, so every
    value that is stored in the database must be naive UTC.

    Using ``datetime.now(timezone.utc).replace(tzinfo=None)`` is the
    forward-compatible equivalent of the deprecated ``datetime.utcnow()``.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
