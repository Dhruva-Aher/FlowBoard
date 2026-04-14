import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.core.utils import utcnow


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(512), default="Untitled", nullable=False)
    content: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    last_edited_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        default=utcnow,
    )
