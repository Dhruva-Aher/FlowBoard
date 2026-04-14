from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models.activity import ActivityLog


async def log(
    db: AsyncSession,
    workspace_id: UUID,
    actor_id: UUID,
    entity_type: str,
    entity_id: UUID,
    action: str,
    meta: dict | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        workspace_id=workspace_id,
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        meta=meta or {},
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


async def get_workspace_activity(
    db: AsyncSession,
    workspace_id: UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[ActivityLog]:
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.workspace_id == workspace_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())
