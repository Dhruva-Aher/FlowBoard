from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models.project import Project, BoardColumn


async def get_by_id(db: AsyncSession, project_id: UUID) -> Project | None:
    result = await db.execute(select(Project).where(Project.id == project_id))
    return result.scalar_one_or_none()


async def get_workspace_projects(db: AsyncSession, workspace_id: UUID) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.workspace_id == workspace_id)
        .order_by(Project.created_at)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    workspace_id: UUID,
    name: str,
    description: str | None,
    created_by: UUID,
) -> Project:
    project = Project(
        workspace_id=workspace_id,
        name=name,
        description=description,
        created_by=created_by,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def update(db: AsyncSession, project: Project, **kwargs) -> Project:
    for key, value in kwargs.items():
        setattr(project, key, value)
    await db.flush()
    await db.refresh(project)
    return project


async def delete(db: AsyncSession, project: Project) -> None:
    await db.delete(project)
    await db.flush()


async def get_columns(db: AsyncSession, project_id: UUID) -> list[BoardColumn]:
    result = await db.execute(
        select(BoardColumn)
        .where(BoardColumn.project_id == project_id)
        .order_by(BoardColumn.position)
    )
    return list(result.scalars().all())


async def create_column(
    db: AsyncSession,
    project_id: UUID,
    name: str,
    position: int,
) -> BoardColumn:
    column = BoardColumn(project_id=project_id, name=name, position=position)
    db.add(column)
    await db.flush()
    await db.refresh(column)
    return column


async def update_column(db: AsyncSession, column: BoardColumn, **kwargs) -> BoardColumn:
    for key, value in kwargs.items():
        setattr(column, key, value)
    await db.flush()
    await db.refresh(column)
    return column


async def delete_column(db: AsyncSession, column: BoardColumn) -> None:
    await db.delete(column)
    await db.flush()


async def get_column_by_id(db: AsyncSession, column_id: UUID) -> BoardColumn | None:
    result = await db.execute(select(BoardColumn).where(BoardColumn.id == column_id))
    return result.scalar_one_or_none()
