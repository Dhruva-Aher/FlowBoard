from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.redis import get_redis
from app.api.deps import get_current_user, get_workspace_member
from app.core.permissions import Role, has_permission
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListItem,
)
from app.schemas.common import MessageResponse
from app.crud import document as document_crud
from app.crud import workspace as workspace_crud
from app.services.realtime_service import publish_event
from app.websocket.events import doc_updated_event
from app.models.user import User
from app.models.workspace import WorkspaceMember

router = APIRouter()


@router.get("/workspaces/{workspace_id}/docs", response_model=list[DocumentListItem])
async def list_documents(
    workspace_id: UUID,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    docs = await document_crud.get_workspace_docs(db, workspace_id)
    return docs


@router.post("/workspaces/{workspace_id}/docs", response_model=DocumentResponse)
async def create_document(
    workspace_id: UUID,
    body: DocumentCreate,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not has_permission(Role(member.role), "doc:edit"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    doc = await document_crud.create(
        db,
        workspace_id=workspace_id,
        title=body.title,
        created_by=current_user.id,
    )
    return doc


@router.get("/docs/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await document_crud.get_by_id(db, doc_id)
    if not doc:
        raise NotFoundException("Document")

    member = await workspace_crud.get_member(db, workspace_id=doc.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "doc:view"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return doc


@router.patch("/docs/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: UUID,
    body: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    doc = await document_crud.get_by_id(db, doc_id)
    if not doc:
        raise NotFoundException("Document")

    member = await workspace_crud.get_member(db, workspace_id=doc.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "doc:edit"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    update_data = body.model_dump(exclude_none=True)
    update_data["last_edited_by"] = current_user.id
    updated = await document_crud.update(db, doc, **update_data)

    # Publish WS event
    await publish_event(
        redis,
        workspace_id=str(doc.workspace_id),
        event="doc.updated",
        payload=doc_updated_event(str(updated.id), updated.title),
        actor={"user_id": str(current_user.id)},
    )

    return updated


@router.delete("/docs/{doc_id}", response_model=MessageResponse)
async def delete_document(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await document_crud.get_by_id(db, doc_id)
    if not doc:
        raise NotFoundException("Document")

    member = await workspace_crud.get_member(db, workspace_id=doc.workspace_id, user_id=current_user.id)
    if not member:
        raise ForbiddenException("Not a member of this workspace")
    if not has_permission(Role(member.role), "doc:edit"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    await document_crud.delete(db, doc)
    return MessageResponse(message="Document deleted successfully")
