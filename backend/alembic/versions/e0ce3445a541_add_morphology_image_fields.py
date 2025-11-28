"""add_morphology_image_fields

Revision ID: e0ce3445a541
Revises: 387290816c0b
Create Date: 2025-11-29 00:44:35.857440

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0ce3445a541'
down_revision: Union[str, None] = '387290816c0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add morphology image fields to fibers table
    op.add_column('fibers', sa.Column('morphology_image_cms_id', sa.String(length=255), nullable=True))
    op.add_column('fibers', sa.Column('morphology_image_url', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove morphology image fields from fibers table
    op.drop_column('fibers', 'morphology_image_url')
    op.drop_column('fibers', 'morphology_image_cms_id')
