from app.core.utils import utcnow
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models.document import Document


async def get_by_id(db: AsyncSession, doc_id: UUID) -> Document | None:
    result = await db.execute(select(Document).where(Document.id == doc_id))
    return result.scalar_one_or_none()


async def get_workspace_docs(db: AsyncSession, workspace_id: UUID) -> list[Document]:
    result = await db.execute(
        select(Document)
        .where(Document.workspace_id == workspace_id)
        .order_by(Document.updated_at.desc())
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    workspace_id: UUID,
    title: str,
    created_by: UUID,
    content: dict | None = None,
) -> Document:
    from app.services.document_content import EMPTY_DOC

    doc = Document(
        workspace_id=workspace_id,
        title=title,
        created_by=created_by,
        content=content if isinstance(content, dict) and content.get("type") == "doc" else EMPTY_DOC,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def update(db: AsyncSession, doc: Document, **kwargs) -> Document:
    for key, value in kwargs.items():
        setattr(doc, key, value)
    doc.updated_at = utcnow()
    await db.flush()
    await db.refresh(doc)
    return doc


async def delete(db: AsyncSession, doc: Document) -> None:
    await db.delete(doc)
    await db.flush()
