import uuid
from datetime import datetime, date
from sqlalchemy import String, Integer, Date, ForeignKey, Text, func, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.core.utils import utcnow


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    column_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("columns.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
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

    column: Mapped["BoardColumn"] = relationship("BoardColumn", back_populates="tasks")  # type: ignore[name-defined]
    labels: Mapped[list["Label"]] = relationship(
        "Label", secondary="task_labels", lazy="selectin"
    )


class Label(Base):
    __tablename__ = "labels"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False, default="#6366f1")


class TaskLabel(Base):
    __tablename__ = "task_labels"

    __table_args__ = (PrimaryKeyConstraint("task_id", "label_id"),)

    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    label_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("labels.id", ondelete="CASCADE"), nullable=False
    )
