"""add elastic_modulus columns to fibers table

Revision ID: f4a5b6c7d8e9
Revises: 450384bae815
Create Date: 2025-11-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a5b6c7d8e9'
down_revision: Union[str, None] = '450384bae815'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add elastic_modulus_min_gpa column
    op.add_column('fibers', sa.Column('elastic_modulus_min_gpa', sa.DECIMAL(8, 2), nullable=True))

    # Add elastic_modulus_max_gpa column
    op.add_column('fibers', sa.Column('elastic_modulus_max_gpa', sa.DECIMAL(8, 2), nullable=True))


def downgrade() -> None:
    # Remove elastic_modulus_max_gpa column
    op.drop_column('fibers', 'elastic_modulus_max_gpa')

    # Remove elastic_modulus_min_gpa column
    op.drop_column('fibers', 'elastic_modulus_min_gpa')
