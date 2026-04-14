from app.core.utils import utcnow
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from app.models.task import Task


async def get_by_id(db: AsyncSession, task_id: UUID) -> Task | None:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalar_one_or_none()


async def get_column_tasks(db: AsyncSession, column_id: UUID) -> list[Task]:
    result = await db.execute(
        select(Task).where(Task.column_id == column_id).order_by(Task.position)
    )
    return list(result.scalars().all())


async def get_project_tasks(db: AsyncSession, project_id: UUID) -> list[Task]:
    result = await db.execute(
        select(Task).where(Task.project_id == project_id).order_by(Task.position)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    column_id: UUID,
    project_id: UUID,
    title: str,
    created_by: UUID,
    **kwargs,
) -> Task:
    task = Task(
        column_id=column_id,
        project_id=project_id,
        title=title,
        created_by=created_by,
        **kwargs,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def update(db: AsyncSession, task: Task, **kwargs) -> Task:
    for key, value in kwargs.items():
        setattr(task, key, value)
    task.updated_at = utcnow()
    await db.flush()
    await db.refresh(task)
    return task


async def delete(db: AsyncSession, task: Task) -> None:
    await db.delete(task)
    await db.flush()


async def move(
    db: AsyncSession,
    task: Task,
    new_column_id: UUID,
    new_position: int,
) -> Task:
    old_column_id = task.column_id
    old_position = task.position

    if old_column_id == new_column_id:
        # Reorder within the same column
        siblings_result = await db.execute(
            select(Task)
            .where(Task.column_id == old_column_id, Task.id != task.id)
            .order_by(Task.position)
        )
        siblings = list(siblings_result.scalars().all())

        # Insert at new_position
        siblings.insert(new_position, task)
        for i, t in enumerate(siblings):
            t.position = i
            t.updated_at = utcnow()
    else:
        # Remove from old column: shift remaining tasks down
        old_siblings_result = await db.execute(
            select(Task)
            .where(Task.column_id == old_column_id, Task.id != task.id)
            .order_by(Task.position)
        )
        old_siblings = list(old_siblings_result.scalars().all())
        for i, t in enumerate(old_siblings):
            t.position = i
            t.updated_at = utcnow()

        # Insert into new column
        new_siblings_result = await db.execute(
            select(Task)
            .where(Task.column_id == new_column_id)
            .order_by(Task.position)
        )
        new_siblings = list(new_siblings_result.scalars().all())
        new_siblings.insert(new_position, task)
        for i, t in enumerate(new_siblings):
            t.position = i
            t.updated_at = utcnow()

        task.column_id = new_column_id

    task.position = new_position
    task.updated_at = utcnow()
    await db.flush()
    await db.refresh(task)
    return task
