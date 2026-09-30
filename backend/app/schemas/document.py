from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Any


class DocumentCreate(BaseModel):
    title: str = "Untitled"
    content: dict[str, Any] | None = None
    template: str | None = Field(
        default=None,
        description="Optional seed template: blank | meeting | spec | standup",
    )


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
    word_count: int = 0
    preview: str = ""

    model_config = {"from_attributes": True}


class DocumentListItem(BaseModel):
    id: UUID
    title: str
    created_by: UUID
    last_edited_by: UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime
    preview: str = ""
    word_count: int = 0

    model_config = {"from_attributes": True}
