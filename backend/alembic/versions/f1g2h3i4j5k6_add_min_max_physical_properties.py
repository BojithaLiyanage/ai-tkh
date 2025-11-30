"""add_min_max_physical_properties

Revision ID: f1g2h3i4j5k6
Revises: e0ce3445a541
Create Date: 2025-11-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1g2h3i4j5k6'
down_revision: Union[str, None] = 'e0ce3445a541'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add min/max columns for density
    op.add_column('fibers', sa.Column('density_g_cm3_min', sa.DECIMAL(precision=8, scale=3), nullable=True))
    op.add_column('fibers', sa.Column('density_g_cm3_max', sa.DECIMAL(precision=8, scale=3), nullable=True))

    # Add min/max columns for moisture_regain
    op.add_column('fibers', sa.Column('moisture_regain_min_percent', sa.DECIMAL(precision=5, scale=2), nullable=True))
    op.add_column('fibers', sa.Column('moisture_regain_max_percent', sa.DECIMAL(precision=5, scale=2), nullable=True))

    # Add min/max columns for absorption_capacity
    op.add_column('fibers', sa.Column('absorption_capacity_min_percent', sa.DECIMAL(precision=6, scale=2), nullable=True))
    op.add_column('fibers', sa.Column('absorption_capacity_max_percent', sa.DECIMAL(precision=6, scale=2), nullable=True))


def downgrade() -> None:
    # Remove columns in reverse order
    op.drop_column('fibers', 'absorption_capacity_max_percent')
    op.drop_column('fibers', 'absorption_capacity_min_percent')
    op.drop_column('fibers', 'moisture_regain_max_percent')
    op.drop_column('fibers', 'moisture_regain_min_percent')
    op.drop_column('fibers', 'density_g_cm3_max')
    op.drop_column('fibers', 'density_g_cm3_min')
