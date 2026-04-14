import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.core.utils import utcnow


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )
