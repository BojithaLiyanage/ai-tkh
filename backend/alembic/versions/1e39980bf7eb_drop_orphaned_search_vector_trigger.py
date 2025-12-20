"""drop_orphaned_search_vector_trigger

Revision ID: 1e39980bf7eb
Revises: 4181f7482016
Create Date: 2025-12-19 01:55:58.212342

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e39980bf7eb'
down_revision: Union[str, None] = '4181f7482016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the orphaned search vector trigger and function
    op.execute('DROP TRIGGER IF EXISTS update_fiber_search_vector_trigger ON fibers')
    op.execute('DROP FUNCTION IF EXISTS update_fiber_search_vector()')


def downgrade() -> None:
    # Recreate the trigger and function if needed to rollback
    # Note: This assumes the search_vector column exists, which it doesn't
    # So this downgrade would fail unless the column is added first
    op.execute('''
        CREATE OR REPLACE FUNCTION update_fiber_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector := to_tsvector('english',
                COALESCE(NEW.name, '') || ' ' ||
                COALESCE(NEW.polymer_composition, '') || ' ' ||
                COALESCE(NEW.sustainability_notes, '') || ' ' ||
                COALESCE(array_to_string(NEW.applications, ' '), '') || ' ' ||
                COALESCE(array_to_string(NEW.trade_names, ' '), '') || ' ' ||
                COALESCE(array_to_string(NEW.sources, ' '), '')
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    ''')

    op.execute('''
        CREATE TRIGGER update_fiber_search_vector_trigger
        BEFORE INSERT OR UPDATE ON fibers
        FOR EACH ROW
        EXECUTE FUNCTION update_fiber_search_vector();
    ''')
