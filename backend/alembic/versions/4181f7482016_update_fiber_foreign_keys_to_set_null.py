"""update_fiber_foreign_keys_to_set_null

Revision ID: 4181f7482016
Revises: f33d388ab02e
Create Date: 2025-12-19 01:41:08.473532

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '4181f7482016'
down_revision: Union[str, None] = 'f33d388ab02e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraints and recreate them with ON DELETE SET NULL

    # Drop and recreate class_id foreign key
    op.drop_constraint('fibers_class_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_class_id_fkey',
        'fibers', 'fiber_classes',
        ['class_id'], ['id'],
        ondelete='SET NULL'
    )

    # Drop and recreate subtype_id foreign key
    op.drop_constraint('fibers_subtype_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_subtype_id_fkey',
        'fibers', 'fiber_subtypes',
        ['subtype_id'], ['id'],
        ondelete='SET NULL'
    )

    # Drop and recreate synthetic_type_id foreign key
    op.drop_constraint('fibers_synthetic_type_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_synthetic_type_id_fkey',
        'fibers', 'synthetic_types',
        ['synthetic_type_id'], ['id'],
        ondelete='SET NULL'
    )

    # Drop and recreate polymerization_type_id foreign key
    op.drop_constraint('fibers_polymerization_type_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_polymerization_type_id_fkey',
        'fibers', 'polymerization_types',
        ['polymerization_type_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Revert back to NO ACTION behavior

    # Drop and recreate class_id foreign key
    op.drop_constraint('fibers_class_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_class_id_fkey',
        'fibers', 'fiber_classes',
        ['class_id'], ['id']
    )

    # Drop and recreate subtype_id foreign key
    op.drop_constraint('fibers_subtype_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_subtype_id_fkey',
        'fibers', 'fiber_subtypes',
        ['subtype_id'], ['id']
    )

    # Drop and recreate synthetic_type_id foreign key
    op.drop_constraint('fibers_synthetic_type_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_synthetic_type_id_fkey',
        'fibers', 'synthetic_types',
        ['synthetic_type_id'], ['id']
    )

    # Drop and recreate polymerization_type_id foreign key
    op.drop_constraint('fibers_polymerization_type_id_fkey', 'fibers', type_='foreignkey')
    op.create_foreign_key(
        'fibers_polymerization_type_id_fkey',
        'fibers', 'polymerization_types',
        ['polymerization_type_id'], ['id']
    )
