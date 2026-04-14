from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.redis import get_redis
from app.api.deps import get_current_user
from app.core.permissions import Role, has_permission
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.task import TaskCreate, TaskUpdate, TaskMoveRequest, TaskResponse
from app.schemas.common import MessageResponse
from app.crud import task as task_crud
from app.crud import project as project_crud
from app.crud import workspace as workspace_crud
from app.services import task_service
from app.models.user import User

router = APIRouter()


async def _get_task_and_member(task_id: UUID, current_user: User, db: AsyncSession):
    task = await task_crud.get_by_id(db, task_id)
    if not task:
        raise NotFoundException("Task")

    project = await project_crud.get_by_id(db, task.project_id)
    if not project:
        raise NotFoundException("Project")

    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")

    return task, member, project


@router.post("/columns/{column_id}/tasks", response_model=TaskResponse)
async def create_task(
    column_id: UUID,
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    column = await project_crud.get_column_by_id(db, column_id)
    if not column:
        raise NotFoundException("Column")

    project = await project_crud.get_by_id(db, column.project_id)
    if not project:
        raise NotFoundException("Project")

    member = await workspace_crud.get_member(db, workspace_id=project.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "task:create"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    task = await task_service.create_task(
        db,
        redis,
        column_id=column_id,
        project_id=column.project_id,
        title=body.title,
        created_by=current_user.id,
        workspace_id=project.workspace_id,
        description=body.description,
        assignee_id=body.assignee_id,
        priority=body.priority,
        due_date=body.due_date,
    )
    return task


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task, member, project = await _get_task_and_member(task_id, current_user, db)
    if not has_permission(Role(member.role), "task:view"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    task, member, project = await _get_task_and_member(task_id, current_user, db)
    if not has_permission(Role(member.role), "task:create"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    update_data = body.model_dump(exclude_none=True)
    updated = await task_service.update_task(
        db,
        redis,
        task=task,
        actor_id=current_user.id,
        workspace_id=project.workspace_id,
        **update_data,
    )
    return updated


@router.delete("/tasks/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    task, member, project = await _get_task_and_member(task_id, current_user, db)
    if not has_permission(Role(member.role), "task:delete"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    await task_service.delete_task(
        db,
        redis,
        task=task,
        actor_id=current_user.id,
        workspace_id=project.workspace_id,
    )
    return MessageResponse(message="Task deleted successfully")


@router.patch("/tasks/{task_id}/move", response_model=TaskResponse)
async def move_task(
    task_id: UUID,
    body: TaskMoveRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    task, member, project = await _get_task_and_member(task_id, current_user, db)
    if not has_permission(Role(member.role), "task:create"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Verify target column is in same project
    target_column = await project_crud.get_column_by_id(db, body.column_id)
    if not target_column or target_column.project_id != task.project_id:
        raise NotFoundException("Target column not found in this project")

    moved = await task_service.move_task(
        db,
        redis,
        task=task,
        new_column_id=body.column_id,
        new_position=body.position,
        actor_id=current_user.id,
        workspace_id=project.workspace_id,
    )
    return moved
