"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-04-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id',            postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email',         sa.String(255), nullable=False),
        sa.Column('name',          sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('avatar_url',    sa.String(512), nullable=True),
        sa.Column('is_active',     sa.Boolean(),   nullable=False, server_default=sa.true()),
        sa.Column('created_at',    sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ── workspaces ─────────────────────────────────────────────────────────────
    op.create_table(
        'workspaces',
        sa.Column('id',         postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name',       sa.String(255), nullable=False),
        sa.Column('slug',       sa.String(255), nullable=False),
        sa.Column('owner_id',   postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('plan',       sa.String(50),  nullable=False, server_default='free'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_workspaces_slug', 'workspaces', ['slug'], unique=True)

    # ── workspace_members ──────────────────────────────────────────────────────
    op.create_table(
        'workspace_members',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id',      postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role',         sa.String(50), nullable=False),
        sa.Column('joined_at',    sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint('workspace_id', 'user_id', name='uq_workspace_user'),
    )
    op.create_index('ix_workspace_members_user_id', 'workspace_members', ['user_id'])

    # ── invitations ────────────────────────────────────────────────────────────
    op.create_table(
        'invitations',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email',        sa.String(255), nullable=False),
        sa.Column('role',         sa.String(50),  nullable=False),
        sa.Column('token',        sa.String(255), nullable=False),
        sa.Column('invited_by',   postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('expires_at',   sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('accepted_at',  sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at',   sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_invitations_token', 'invitations', ['token'], unique=True)

    # ── refresh_tokens ─────────────────────────────────────────────────────────
    op.create_table(
        'refresh_tokens',
        sa.Column('id',          postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id',     postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash',  sa.Text(),    nullable=False),
        sa.Column('expires_at',  sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('revoked',     sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at',  sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])

    # ── projects ───────────────────────────────────────────────────────────────
    op.create_table(
        'projects',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name',         sa.String(255), nullable=False),
        sa.Column('description',  sa.Text(),      nullable=True),
        sa.Column('created_by',   postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at',   sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_projects_workspace_id', 'projects', ['workspace_id'])

    # ── columns ────────────────────────────────────────────────────────────────
    op.create_table(
        'columns',
        sa.Column('id',         postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name',       sa.String(255), nullable=False),
        sa.Column('position',   sa.Integer(),   nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_columns_project_id', 'columns', ['project_id'])

    # ── tasks ──────────────────────────────────────────────────────────────────
    op.create_table(
        'tasks',
        sa.Column('id',          postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('column_id',   postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('columns.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id',  postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title',       sa.String(255), nullable=False),
        sa.Column('description', sa.Text(),      nullable=True),
        sa.Column('assignee_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('priority',    sa.String(20),  nullable=False, server_default='medium'),
        sa.Column('due_date',    sa.Date(),      nullable=True),
        sa.Column('position',    sa.Integer(),   nullable=False),
        sa.Column('created_by',  postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at',  sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at',  sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_tasks_column_id',  'tasks', ['column_id'])
    op.create_index('ix_tasks_project_id', 'tasks', ['project_id'])

    # ── labels ─────────────────────────────────────────────────────────────────
    op.create_table(
        'labels',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name',         sa.String(50), nullable=False),
        sa.Column('color',        sa.String(7),  nullable=False),
    )

    # ── task_labels ────────────────────────────────────────────────────────────
    op.create_table(
        'task_labels',
        sa.Column('task_id',  postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('tasks.id',  ondelete='CASCADE'), primary_key=True),
        sa.Column('label_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('labels.id', ondelete='CASCADE'), primary_key=True),
    )

    # ── documents ──────────────────────────────────────────────────────────────
    op.create_table(
        'documents',
        sa.Column('id',             postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id',   postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title',          sa.String(255), nullable=False, server_default='Untitled'),
        sa.Column('content',        postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_by',     postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('last_edited_by', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at',     sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at',     sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_documents_workspace_id', 'documents', ['workspace_id'])

    # ── activity_log ───────────────────────────────────────────────────────────
    op.create_table(
        'activity_log',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_id',     postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('entity_type',  sa.String(50), nullable=False),
        sa.Column('entity_id',    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action',       sa.String(50), nullable=False),
        sa.Column('meta',         postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at',   sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index('ix_activity_log_workspace_created',
                    'activity_log', ['workspace_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('activity_log')
    op.drop_table('documents')
    op.drop_table('task_labels')
    op.drop_table('labels')
    op.drop_table('tasks')
    op.drop_table('columns')
    op.drop_table('projects')
    op.drop_table('refresh_tokens')
    op.drop_table('invitations')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')
    op.drop_table('users')
