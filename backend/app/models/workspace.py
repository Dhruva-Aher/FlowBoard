import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.core.utils import utcnow


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )

    members: Mapped[list["WorkspaceMember"]] = relationship(
        "WorkspaceMember", back_populates="workspace", lazy="selectin"
    )


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="members")
    user: Mapped["User"] = relationship("User", lazy="selectin")  # type: ignore[name-defined]


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    invited_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), default=utcnow
    )
