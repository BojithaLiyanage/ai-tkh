"""update_user_types

Revision ID: update_user_types
Revises: b1c2d3e4f5a6
Create Date: 2025-01-25 19:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_user_types'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the old constraint
    op.drop_constraint('users_user_type_check', 'users', type_='check')
    
    # Alter the column to increase length
    op.alter_column('users', 'user_type', type_=sa.String(15))
    
    # Update existing data: 'normal' -> 'client'
    op.execute("UPDATE users SET user_type = 'client' WHERE user_type = 'normal'")
    
    # Add the new constraint with 3 user types
    op.create_check_constraint(
        'users_user_type_check',
        'users',
        "user_type in ('super_admin','admin','client')"
    )
    
    # Update the default value
    op.alter_column('users', 'user_type', server_default=sa.text("'client'"))


def downgrade() -> None:
    # Drop the new constraint
    op.drop_constraint('users_user_type_check', 'users', type_='check')
    
    # Update data back: 'client' -> 'normal', remove super_admin entries
    op.execute("UPDATE users SET user_type = 'normal' WHERE user_type = 'client'")
    op.execute("DELETE FROM users WHERE user_type = 'super_admin'")
    
    # Alter column back to smaller length
    op.alter_column('users', 'user_type', type_=sa.String(10))
    
    # Restore old constraint
    op.create_check_constraint(
        'users_user_type_check',
        'users',
        "user_type in ('admin','normal')"
    )
    
    # Restore old default
    op.alter_column('users', 'user_type', server_default=sa.text("'normal'"))