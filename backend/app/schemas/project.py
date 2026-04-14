from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: str | None
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class ColumnCreate(BaseModel):
    name: str
    position: int | None = None


class ColumnUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class ColumnResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    position: int

    model_config = {"from_attributes": True}


class TaskInBoard(BaseModel):
    id: UUID
    title: str
    description: str | None
    assignee_id: UUID | None
    priority: str
    due_date: str | None
    position: int
    column_id: UUID

    model_config = {"from_attributes": True}


class ColumnWithTasks(BaseModel):
    id: UUID
    name: str
    position: int
    tasks: list[TaskInBoard]

    model_config = {"from_attributes": True}


class BoardResponse(BaseModel):
    project_id: UUID
    columns: list[ColumnWithTasks]
