"""add_search_vector_column_to_fibers

Revision ID: d552e916cfa0
Revises: 1e39980bf7eb
Create Date: 2025-12-19 01:56:58.269059

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd552e916cfa0'
down_revision: Union[str, None] = '1e39980bf7eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add search_vector column for full-text search
    op.execute('''
        ALTER TABLE fibers
        ADD COLUMN IF NOT EXISTS search_vector tsvector
    ''')

    # Create GIN index for efficient full-text search
    op.execute('''
        CREATE INDEX IF NOT EXISTS idx_fibers_search_vector
        ON fibers USING GIN(search_vector)
    ''')

    # Update existing rows to populate the search_vector
    op.execute('''
        UPDATE fibers
        SET search_vector = to_tsvector('english',
            COALESCE(name, '') || ' ' ||
            COALESCE(polymer_composition, '') || ' ' ||
            COALESCE(sustainability_notes, '') || ' ' ||
            COALESCE(array_to_string(applications, ' '), '') || ' ' ||
            COALESCE(array_to_string(trade_names, ' '), '') || ' ' ||
            COALESCE(array_to_string(sources, ' '), '')
        )
    ''')


def downgrade() -> None:
    # Drop the index and column
    op.execute('DROP INDEX IF EXISTS idx_fibers_search_vector')
    op.execute('ALTER TABLE fibers DROP COLUMN IF EXISTS search_vector')
