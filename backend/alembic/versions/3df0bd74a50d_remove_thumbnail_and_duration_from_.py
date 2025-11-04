"""remove_thumbnail_and_duration_from_video_links

Revision ID: 3df0bd74a50d
Revises: 450384bae815
Create Date: 2025-11-02 21:08:40.391120

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3df0bd74a50d'
down_revision: Union[str, None] = '450384bae815'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove thumbnail_url and duration columns from fiber_video_links table
    op.drop_column('fiber_video_links', 'thumbnail_url')
    op.drop_column('fiber_video_links', 'duration')


def downgrade() -> None:
    # Add back the columns if we need to rollback
    op.add_column('fiber_video_links', sa.Column('thumbnail_url', sa.Text(), nullable=True))
    op.add_column('fiber_video_links', sa.Column('duration', sa.String(20), nullable=True))
