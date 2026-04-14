from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
import redis.asyncio as aioredis

from app.database import get_db
from app.redis import get_redis
from app.api.deps import get_current_user, get_workspace_member
from app.core.permissions import require_permission
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ColumnCreate,
    ColumnUpdate,
    ColumnResponse,
    BoardResponse,
    ColumnWithTasks,
    TaskInBoard,
)
from app.schemas.common import MessageResponse
from app.crud import project as project_crud
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project, BoardColumn
from app.models.task import Task

router = APIRouter()


@router.get("/workspaces/{workspace_id}/projects", response_model=list[ProjectResponse])
async def list_projects(
    workspace_id: UUID,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    projects = await project_crud.get_workspace_projects(db, workspace_id)
    return projects


@router.post("/workspaces/{workspace_id}/projects", response_model=ProjectResponse)
async def create_project(
    workspace_id: UUID,
    body: ProjectCreate,
    member: WorkspaceMember = Depends(require_permission("project:create")),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await project_crud.create(
        db,
        workspace_id=workspace_id,
        name=body.name,
        description=body.description,
        created_by=current_user.id,
    )

    # Seed default Kanban columns so the board is usable immediately
    for position, col_name in enumerate(["To Do", "In Progress", "Done"]):
        await project_crud.create_column(
            db, project_id=project.id, name=col_name, position=position
        )

    return project


@router.get("/projects/{project_id}/board", response_model=BoardResponse)
async def get_board(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await project_crud.get_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")

    # Verify membership
    from app.crud import workspace as workspace_crud
    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")

    # Fetch columns with tasks via selectinload
    result = await db.execute(
        select(BoardColumn)
        .options(selectinload(BoardColumn.tasks))
        .where(BoardColumn.project_id == project_id)
        .order_by(BoardColumn.position)
    )
    columns = list(result.scalars().all())

    columns_with_tasks = []
    for col in columns:
        tasks_sorted = sorted(col.tasks, key=lambda t: t.position)
        task_items = [
            TaskInBoard(
                id=t.id,
                title=t.title,
                description=t.description,
                assignee_id=t.assignee_id,
                priority=t.priority,
                due_date=str(t.due_date) if t.due_date else None,
                position=t.position,
                column_id=t.column_id,
            )
            for t in tasks_sorted
        ]
        columns_with_tasks.append(
            ColumnWithTasks(id=col.id, name=col.name, position=col.position, tasks=task_items)
        )

    return BoardResponse(project_id=project_id, columns=columns_with_tasks)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await project_crud.get_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")

    from app.crud import workspace as workspace_crud
    from app.core.permissions import Role, has_permission
    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "project:create"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    update_data = body.model_dump(exclude_none=True)
    updated = await project_crud.update(db, project, **update_data)
    return updated


@router.delete("/projects/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await project_crud.get_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")

    from app.crud import workspace as workspace_crud
    from app.core.permissions import Role, has_permission
    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "project:delete"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    await project_crud.delete(db, project)
    return MessageResponse(message="Project deleted successfully")


@router.post("/projects/{project_id}/columns", response_model=ColumnResponse)
async def create_column(
    project_id: UUID,
    body: ColumnCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await project_crud.get_by_id(db, project_id)
    if not project:
        raise NotFoundException("Project")

    from app.crud import workspace as workspace_crud
    from app.core.permissions import Role, has_permission
    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "project:create"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Determine position
    if body.position is not None:
        position = body.position
    else:
        existing = await project_crud.get_columns(db, project_id)
        position = len(existing)

    column = await project_crud.create_column(db, project_id=project_id, name=body.name, position=position)
    return column


@router.patch("/columns/{column_id}", response_model=ColumnResponse)
async def update_column(
    column_id: UUID,
    body: ColumnUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    column = await project_crud.get_column_by_id(db, column_id)
    if not column:
        raise NotFoundException("Column")

    project = await project_crud.get_by_id(db, column.project_id)
    if not project:
        raise NotFoundException("Project")

    from app.crud import workspace as workspace_crud
    from app.core.permissions import Role, has_permission
    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "project:create"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    update_data = body.model_dump(exclude_none=True)
    updated = await project_crud.update_column(db, column, **update_data)
    return updated


@router.delete("/columns/{column_id}", response_model=MessageResponse)
async def delete_column(
    column_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    column = await project_crud.get_column_by_id(db, column_id)
    if not column:
        raise NotFoundException("Column")

    project = await project_crud.get_by_id(db, column.project_id)
    if not project:
        raise NotFoundException("Project")

    from app.crud import workspace as workspace_crud
    from app.core.permissions import Role, has_permission
    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "project:delete"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    await project_crud.delete_column(db, column)
    return MessageResponse(message="Column deleted successfully")
