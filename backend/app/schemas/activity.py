from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Any


class ActivityLogResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    actor_id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    meta: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}
