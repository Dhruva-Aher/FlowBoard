from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import redis.asyncio as aioredis

from app.crud import task as task_crud
from app.crud import activity as activity_crud
from app.models.task import Task
from app.services.realtime_service import publish_event
from app.websocket.events import (
    task_created_event,
    task_moved_event,
    task_updated_event,
    task_deleted_event,
)


async def create_task(
    db: AsyncSession,
    redis: aioredis.Redis,
    column_id: UUID,
    project_id: UUID,
    title: str,
    created_by: UUID,
    workspace_id: UUID,
    **kwargs,
) -> Task:
    # Get max position in the column
    from app.models.task import Task as TaskModel
    result = await db.execute(
        select(func.max(TaskModel.position)).where(TaskModel.column_id == column_id)
    )
    max_pos = result.scalar() or -1
    position = max_pos + 1

    task = await task_crud.create(
        db,
        column_id=column_id,
        project_id=project_id,
        title=title,
        created_by=created_by,
        position=position,
        **kwargs,
    )

    # Log activity
    await activity_crud.log(
        db,
        workspace_id=workspace_id,
        actor_id=created_by,
        entity_type="task",
        entity_id=task.id,
        action="task.created",
        meta={"title": title},
    )

    # Publish WS event
    await publish_event(
        redis,
        workspace_id=str(workspace_id),
        event="task.created",
        payload=task_created_event(str(task.id), str(column_id), title),
        actor={"user_id": str(created_by)},
    )

    return task


async def move_task(
    db: AsyncSession,
    redis: aioredis.Redis,
    task: Task,
    new_column_id: UUID,
    new_position: int,
    actor_id: UUID,
    workspace_id: UUID,
) -> Task:
    old_column_id = task.column_id

    updated_task = await task_crud.move(db, task, new_column_id=new_column_id, new_position=new_position)

    # Invalidate board cache for the project
    await redis.delete(f"project:{task.project_id}:board")

    # Publish WS event
    await publish_event(
        redis,
        workspace_id=str(workspace_id),
        event="task.moved",
        payload=task_moved_event(
            str(updated_task.id),
            str(old_column_id),
            str(new_column_id),
            new_position,
        ),
        actor={"user_id": str(actor_id)},
    )

    return updated_task


async def update_task(
    db: AsyncSession,
    redis: aioredis.Redis,
    task: Task,
    actor_id: UUID,
    workspace_id: UUID,
    **kwargs,
) -> Task:
    updated_task = await task_crud.update(db, task, **kwargs)

    # Publish WS event
    await publish_event(
        redis,
        workspace_id=str(workspace_id),
        event="task.updated",
        payload=task_updated_event(str(updated_task.id), {k: str(v) for k, v in kwargs.items() if v is not None}),
        actor={"user_id": str(actor_id)},
    )

    return updated_task


async def delete_task(
    db: AsyncSession,
    redis: aioredis.Redis,
    task: Task,
    actor_id: UUID,
    workspace_id: UUID,
) -> None:
    task_id = str(task.id)

    await task_crud.delete(db, task)

    # Publish WS event
    await publish_event(
        redis,
        workspace_id=str(workspace_id),
        event="task.deleted",
        payload=task_deleted_event(task_id),
        actor={"user_id": str(actor_id)},
    )
