from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.redis import get_redis
from app.api.deps import get_current_user, get_workspace_member
from app.core.permissions import require_permission
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from app.schemas.common import MessageResponse
from app.services import workspace_service
from app.crud import workspace as workspace_crud
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.workspace import WorkspaceMember

router = APIRouter()


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    workspaces = await workspace_service.get_user_workspaces(db, redis, current_user.id)
    return workspaces


@router.post("", response_model=WorkspaceResponse)
async def create_workspace(
    body: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    workspace = await workspace_service.create_workspace(
        db, redis, name=body.name, slug=body.slug, owner_id=current_user.id
    )
    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    workspace = await workspace_crud.get_by_id(db, workspace_id)
    if not workspace:
        raise NotFoundException("Workspace")
    return workspace


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: UUID,
    body: WorkspaceUpdate,
    member: WorkspaceMember = Depends(require_permission("workspace:settings")),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    workspace = await workspace_crud.get_by_id(db, workspace_id)
    if not workspace:
        raise NotFoundException("Workspace")

    # Check slug uniqueness if changing
    if body.slug and body.slug != workspace.slug:
        existing = await workspace_crud.get_by_slug(db, body.slug)
        if existing:
            from app.core.exceptions import ConflictException
            raise ConflictException(f"Slug '{body.slug}' is already taken")

    update_data = body.model_dump(exclude_none=True)
    updated = await workspace_crud.update(db, workspace, **update_data)

    # Invalidate cache
    await redis.delete(f"workspace:{workspace_id}:meta")

    return updated


@router.delete("/{workspace_id}", response_model=MessageResponse)
async def delete_workspace(
    workspace_id: UUID,
    member: WorkspaceMember = Depends(require_permission("workspace:delete")),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    workspace = await workspace_crud.get_by_id(db, workspace_id)
    if not workspace:
        raise NotFoundException("Workspace")

    await workspace_crud.delete(db, workspace)

    # Invalidate caches
    await redis.delete(f"workspace:{workspace_id}:meta")

    return MessageResponse(message="Workspace deleted successfully")
