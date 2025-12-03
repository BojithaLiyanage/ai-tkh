"""create_special_fibers_table

Revision ID: g4j5k6l7m8n9
Revises: f3i4j5k6l7m8
Create Date: 2025-12-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'g4j5k6l7m8n9'
down_revision: Union[str, None] = 'f3i4j5k6l7m8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create special_fibers table with JSON properties (standalone, no FK to fibers)
    op.create_table(
        'special_fibers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('properties', JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # Create special_fiber_embeddings table for optional semantic search
    op.create_table(
        'special_fiber_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('special_fiber_id', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('content_text', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('embedding_model', sa.String(100), server_default='text-embedding-3-small'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=False),
        sa.ForeignKeyConstraint(['special_fiber_id'], ['special_fibers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('special_fiber_id', 'content_type', name='unique_embedding_per_type'),
    )
    op.create_index('idx_special_fiber_embedding_type', 'special_fiber_embeddings', ['content_type'])


def downgrade() -> None:
    # Drop embedding table first (due to foreign key)
    op.drop_table('special_fiber_embeddings', if_exists=True)

    # Drop special_fibers table
    op.drop_table('special_fibers', if_exists=True)
