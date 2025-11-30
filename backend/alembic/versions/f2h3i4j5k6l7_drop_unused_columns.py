"""drop_unused_columns

Revision ID: f2h3i4j5k6l7
Revises: f1g2h3i4j5k6
Create Date: 2025-11-30 12:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2h3i4j5k6l7'
down_revision: Union[str, None] = 'f1g2h3i4j5k6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop thermal property columns that are never used (always NULL after import)
    op.drop_column('fibers', 'glass_transition_temp_c')
    op.drop_column('fibers', 'melting_point_c')
    op.drop_column('fibers', 'decomposition_temp_c')

    # Drop molecular structure SMILES (no data in imports, use structure_image_url instead)
    op.drop_column('fibers', 'molecular_structure_smiles')

    # Drop environmental impact score (no data in imports)
    op.drop_column('fibers', 'environmental_impact_score')


def downgrade() -> None:
    # Re-add columns in reverse order
    op.add_column('fibers', sa.Column('environmental_impact_score', sa.INTEGER(), nullable=True))
    op.add_column('fibers', sa.Column('molecular_structure_smiles', sa.TEXT(), nullable=True))
    op.add_column('fibers', sa.Column('decomposition_temp_c', sa.DECIMAL(precision=6, scale=2), nullable=True))
    op.add_column('fibers', sa.Column('melting_point_c', sa.DECIMAL(precision=6, scale=2), nullable=True))
    op.add_column('fibers', sa.Column('glass_transition_temp_c', sa.DECIMAL(precision=6, scale=2), nullable=True))
