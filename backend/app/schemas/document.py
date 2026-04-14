from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Any


class DocumentCreate(BaseModel):
    title: str = "Untitled"


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None


class DocumentResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    title: str
    content: dict[str, Any]
    created_by: UUID
    last_edited_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListItem(BaseModel):
    id: UUID
    title: str
    created_by: UUID
    updated_at: datetime

    model_config = {"from_attributes": True}
