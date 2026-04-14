from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_workspace_member
from app.schemas.activity import ActivityLogResponse
from app.crud import activity as activity_crud
from app.models.workspace import WorkspaceMember

router = APIRouter()


@router.get("/workspaces/{workspace_id}/activity", response_model=list[ActivityLogResponse])
async def get_workspace_activity(
    workspace_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    logs = await activity_crud.get_workspace_activity(
        db, workspace_id=workspace_id, limit=limit, offset=offset
    )
    return logs
