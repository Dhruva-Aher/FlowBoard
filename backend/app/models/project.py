import uuid
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.core.utils import utcnow


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )

    columns: Mapped[list["BoardColumn"]] = relationship(
        "BoardColumn", back_populates="project", lazy="selectin", order_by="BoardColumn.position"
    )


class BoardColumn(Base):
    __tablename__ = "columns"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )

    project: Mapped["Project"] = relationship("Project", back_populates="columns")
    tasks: Mapped[list["Task"]] = relationship(  # type: ignore[name-defined]
        "Task", back_populates="column", lazy="selectin", order_by="Task.position"
    )
