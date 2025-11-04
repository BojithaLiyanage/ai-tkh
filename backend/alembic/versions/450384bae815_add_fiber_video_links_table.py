"""add_fiber_video_links_table

Revision ID: 450384bae815
Revises: d81630fbbfa2
Create Date: 2025-11-02 20:52:46.673897

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '450384bae815'
down_revision: Union[str, None] = 'd81630fbbfa2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create fiber_video_links table
    op.create_table(
        'fiber_video_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fiber_id', sa.Integer(), nullable=False),
        sa.Column('video_link', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('thumbnail_url', sa.Text(), nullable=True),
        sa.Column('duration', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['fiber_id'], ['fibers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create unique index on fiber_id and video_link
    op.create_index('idx_fiber_video_unique', 'fiber_video_links', ['fiber_id', 'video_link'], unique=True)


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_fiber_video_unique', 'fiber_video_links')

    # Drop table
    op.drop_table('fiber_video_links')
