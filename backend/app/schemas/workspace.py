from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class WorkspaceCreate(BaseModel):
    name: str
    slug: str


class WorkspaceUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    owner_id: UUID
    plan: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserInMember(BaseModel):
    id: UUID
    name: str
    email: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    workspace_id: UUID
    role: str
    joined_at: datetime
    user: UserInMember

    model_config = {"from_attributes": True}


class InviteRequest(BaseModel):
    email: str
    role: str = "member"


class RoleUpdateRequest(BaseModel):
    role: str
