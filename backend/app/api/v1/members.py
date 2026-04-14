from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.redis import get_redis
from app.api.deps import get_current_user, get_workspace_member
from app.core.permissions import require_permission
from app.schemas.workspace import MemberResponse, InviteRequest, RoleUpdateRequest
from app.schemas.common import MessageResponse
from app.services import workspace_service
from app.crud import workspace as workspace_crud
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.user import User
from app.models.workspace import WorkspaceMember

router = APIRouter()


@router.get("/workspaces/{workspace_id}/members", response_model=list[MemberResponse])
async def list_members(
    workspace_id: UUID,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    members = await workspace_crud.get_members(db, workspace_id)
    return members


@router.post("/workspaces/{workspace_id}/invitations", response_model=MessageResponse)
async def invite_member(
    workspace_id: UUID,
    body: InviteRequest,
    member: WorkspaceMember = Depends(require_permission("member:invite")),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    await workspace_service.invite_member(
        db,
        redis,
        workspace_id=workspace_id,
        email=body.email,
        role=body.role,
        invited_by=current_user.id,
    )
    return MessageResponse(message=f"Invitation sent to {body.email}")


@router.delete("/workspaces/{workspace_id}/members/{user_id}", response_model=MessageResponse)
async def remove_member(
    workspace_id: UUID,
    user_id: UUID,
    requesting_member: WorkspaceMember = Depends(require_permission("member:remove")),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    target_member = await workspace_crud.get_member(db, workspace_id=workspace_id, user_id=user_id)
    if not target_member:
        raise NotFoundException("Member")

    # Cannot remove workspace owner
    if target_member.role == "owner":
        raise ForbiddenException("Cannot remove the workspace owner")

    await workspace_crud.remove_member(db, target_member)

    # Invalidate cache
    await redis.delete(f"user:{user_id}:workspaces")

    return MessageResponse(message="Member removed successfully")


@router.patch("/workspaces/{workspace_id}/members/{user_id}", response_model=MemberResponse)
async def update_member_role(
    workspace_id: UUID,
    user_id: UUID,
    body: RoleUpdateRequest,
    requesting_member: WorkspaceMember = Depends(require_permission("member:role_change")),
    db: AsyncSession = Depends(get_db),
):
    target_member = await workspace_crud.get_member(db, workspace_id=workspace_id, user_id=user_id)
    if not target_member:
        raise NotFoundException("Member")

    updated = await workspace_crud.update_member_role(db, target_member, role=body.role)
    return updated


@router.post("/invitations/{token}/accept", response_model=MemberResponse)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    member = await workspace_service.accept_invitation(db, redis, token=token, current_user_id=current_user.id)
    return member
