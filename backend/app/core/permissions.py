from enum import Enum
from fastapi import HTTPException


class Role(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


ROLE_HIERARCHY = {Role.OWNER: 4, Role.ADMIN: 3, Role.MEMBER: 2, Role.VIEWER: 1}

PERMISSIONS: dict[str, set[Role]] = {
    "workspace:delete":   {Role.OWNER},
    "workspace:settings": {Role.OWNER, Role.ADMIN},
    "member:invite":      {Role.OWNER, Role.ADMIN},
    "member:remove":      {Role.OWNER, Role.ADMIN},
    "member:role_change": {Role.OWNER},
    "project:create":     {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "project:delete":     {Role.OWNER, Role.ADMIN},
    "task:create":        {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "task:delete":        {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "task:view":          {Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER},
    "doc:edit":           {Role.OWNER, Role.ADMIN, Role.MEMBER},
    "doc:view":           {Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER},
}


def has_permission(role: Role, permission: str) -> bool:
    return role in PERMISSIONS.get(permission, set())


def require_permission(permission: str):
    """FastAPI dependency factory — inject after get_workspace_member."""
    from app.api.deps import get_workspace_member
    from fastapi import Depends
    from app.models.workspace import WorkspaceMember

    async def _check(member: WorkspaceMember = Depends(get_workspace_member)) -> WorkspaceMember:
        if not has_permission(Role(member.role), permission):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return member

    return _check
