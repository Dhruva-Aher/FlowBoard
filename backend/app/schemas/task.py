from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    assignee_id: UUID | None = None
    priority: str = "medium"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignee_id: UUID | None = None
    priority: str | None = None
    due_date: date | None = None


class TaskMoveRequest(BaseModel):
    column_id: UUID
    position: int


class TaskResponse(BaseModel):
    id: UUID
    column_id: UUID
    project_id: UUID
    title: str
    description: str | None
    assignee_id: UUID | None
    priority: str
    due_date: date | None
    position: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
