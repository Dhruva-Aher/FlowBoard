from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime
from app.models.workspace import Workspace, WorkspaceMember, Invitation


async def get_by_id(db: AsyncSession, workspace_id: UUID) -> Workspace | None:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    return result.scalar_one_or_none()


async def get_by_slug(db: AsyncSession, slug: str) -> Workspace | None:
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    return result.scalar_one_or_none()


async def get_user_workspaces(db: AsyncSession, user_id: UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.created_at)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    name: str,
    slug: str,
    owner_id: UUID,
) -> Workspace:
    workspace = Workspace(name=name, slug=slug, owner_id=owner_id)
    db.add(workspace)
    await db.flush()
    await db.refresh(workspace)
    return workspace


async def update(db: AsyncSession, workspace: Workspace, **kwargs) -> Workspace:
    for key, value in kwargs.items():
        if value is not None:
            setattr(workspace, key, value)
    await db.flush()
    await db.refresh(workspace)
    return workspace


async def delete(db: AsyncSession, workspace: Workspace) -> None:
    await db.delete(workspace)
    await db.flush()


async def get_member(
    db: AsyncSession, workspace_id: UUID, user_id: UUID
) -> WorkspaceMember | None:
    result = await db.execute(
        select(WorkspaceMember)
        .options(selectinload(WorkspaceMember.user))
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_members(db: AsyncSession, workspace_id: UUID) -> list[WorkspaceMember]:
    result = await db.execute(
        select(WorkspaceMember)
        .options(selectinload(WorkspaceMember.user))
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at)
    )
    return list(result.scalars().all())


async def add_member(
    db: AsyncSession,
    workspace_id: UUID,
    user_id: UUID,
    role: str,
) -> WorkspaceMember:
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


async def update_member_role(
    db: AsyncSession, member: WorkspaceMember, role: str
) -> WorkspaceMember:
    member.role = role
    await db.flush()
    await db.refresh(member)
    return member


async def remove_member(db: AsyncSession, member: WorkspaceMember) -> None:
    await db.delete(member)
    await db.flush()


async def create_invitation(
    db: AsyncSession,
    workspace_id: UUID,
    email: str,
    role: str,
    token: str,
    invited_by: UUID,
    expires_at: datetime,
) -> Invitation:
    invitation = Invitation(
        workspace_id=workspace_id,
        email=email,
        role=role,
        token=token,
        invited_by=invited_by,
        expires_at=expires_at,
    )
    db.add(invitation)
    await db.flush()
    await db.refresh(invitation)
    return invitation


async def get_invitation_by_token(db: AsyncSession, token: str) -> Invitation | None:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    return result.scalar_one_or_none()
