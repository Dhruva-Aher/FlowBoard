import json
import secrets
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.crud import workspace as workspace_crud
from app.crud import user as user_crud
from app.core.exceptions import ConflictException, NotFoundException
from app.core.utils import utcnow
from app.models.workspace import Workspace, WorkspaceMember, Invitation
from app.config import settings


async def create_workspace(
    db: AsyncSession,
    redis: aioredis.Redis,
    name: str,
    slug: str,
    owner_id: UUID,
) -> Workspace:
    existing = await workspace_crud.get_by_slug(db, slug)
    if existing:
        raise ConflictException(f"Slug '{slug}' is already taken")

    workspace = await workspace_crud.create(db, name=name, slug=slug, owner_id=owner_id)
    await workspace_crud.add_member(db, workspace_id=workspace.id, user_id=owner_id, role="owner")

    # Invalidate user workspace cache
    await redis.delete(f"user:{owner_id}:workspaces")

    return workspace


async def get_user_workspaces(
    db: AsyncSession,
    redis: aioredis.Redis,
    user_id: UUID,
) -> list[Workspace]:
    cache_key = f"user:{user_id}:workspaces"
    cached = await redis.get(cache_key)
    if cached:
        # Return workspaces from DB (IDs in cache, but we need ORM objects for serialization)
        workspace_ids = json.loads(cached)
        workspaces = []
        for ws_id in workspace_ids:
            ws = await workspace_crud.get_by_id(db, UUID(ws_id))
            if ws:
                workspaces.append(ws)
        return workspaces

    workspaces = await workspace_crud.get_user_workspaces(db, user_id)
    workspace_ids = [str(ws.id) for ws in workspaces]
    await redis.set(cache_key, json.dumps(workspace_ids), ex=300)
    return workspaces


async def get_workspace(
    db: AsyncSession,
    redis: aioredis.Redis,
    workspace_id: UUID,
) -> Workspace:
    cache_key = f"workspace:{workspace_id}:meta"
    cached = await redis.get(cache_key)
    if cached:
        # Fetch fresh from DB to get ORM object (cache used as existence hint)
        ws = await workspace_crud.get_by_id(db, workspace_id)
        if ws:
            return ws

    ws = await workspace_crud.get_by_id(db, workspace_id)
    if not ws:
        raise NotFoundException("Workspace")

    await redis.set(cache_key, json.dumps({"id": str(ws.id)}), ex=300)
    return ws


async def invite_member(
    db: AsyncSession,
    redis: aioredis.Redis,
    workspace_id: UUID,
    email: str,
    role: str,
    invited_by: UUID,
) -> Invitation:
    token = secrets.token_urlsafe(32)
    expires_at = utcnow() + timedelta(days=7)

    invitation = await workspace_crud.create_invitation(
        db,
        workspace_id=workspace_id,
        email=email,
        role=role,
        token=token,
        invited_by=invited_by,
        expires_at=expires_at,
    )

    # Enqueue Celery email task
    try:
        from app.worker.tasks.email_tasks import send_invitation_email
        ws = await workspace_crud.get_by_id(db, workspace_id)
        workspace_name = ws.name if ws else "FlowBoard Workspace"
        invite_url = f"{settings.FRONTEND_URL}/invitations/{token}/accept"
        send_invitation_email.delay(email, workspace_name, invite_url)
    except Exception:
        pass  # Email failure should not block invitation creation

    return invitation


async def accept_invitation(
    db: AsyncSession,
    redis: aioredis.Redis,
    token: str,
    current_user_id: UUID,
) -> WorkspaceMember:
    invitation = await workspace_crud.get_invitation_by_token(db, token)
    if not invitation:
        raise NotFoundException("Invitation")

    now = utcnow()
    if invitation.expires_at < now:
        raise ConflictException("Invitation has expired")

    if invitation.accepted_at is not None:
        raise ConflictException("Invitation has already been accepted")

    # Check that the current user's email matches the invitation email
    user = await user_crud.get_by_id(db, current_user_id)
    if not user:
        raise NotFoundException("User")

    if user.email.lower() != invitation.email.lower():
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("This invitation was sent to a different email address")

    # Check if already a member
    existing_member = await workspace_crud.get_member(
        db, workspace_id=invitation.workspace_id, user_id=current_user_id
    )
    if existing_member:
        raise ConflictException("Already a member of this workspace")

    member = await workspace_crud.add_member(
        db,
        workspace_id=invitation.workspace_id,
        user_id=current_user_id,
        role=invitation.role,
    )

    # Mark invitation as accepted
    invitation.accepted_at = now
    await db.flush()

    # Invalidate caches
    await redis.delete(f"user:{current_user_id}:workspaces")
    await redis.delete(f"workspace:{invitation.workspace_id}:members")

    return member
