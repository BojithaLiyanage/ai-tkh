"""drop_old_single_value_columns

Revision ID: f3i4j5k6l7m8
Revises: f2h3i4j5k6l7
Create Date: 2025-11-30 12:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3i4j5k6l7m8'
down_revision: Union[str, None] = 'f2h3i4j5k6l7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, drop the view that depends on these columns
    op.execute('DROP VIEW IF EXISTS fiber_statistics_view')

    # Drop old single-value columns that have been replaced by min/max versions
    op.drop_column('fibers', 'density_g_cm3')
    op.drop_column('fibers', 'moisture_regain_percent')
    op.drop_column('fibers', 'absorption_capacity_percent')


def downgrade() -> None:
    # Re-add columns in reverse order
    op.add_column('fibers', sa.Column('absorption_capacity_percent', sa.DECIMAL(precision=6, scale=2), nullable=True))
    op.add_column('fibers', sa.Column('moisture_regain_percent', sa.DECIMAL(precision=5, scale=2), nullable=True))
    op.add_column('fibers', sa.Column('density_g_cm3', sa.DECIMAL(precision=8, scale=3), nullable=True))
