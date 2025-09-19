"""add_timestamps_to_content_tables

Revision ID: e15c709dcf8d
Revises: add_clients_table_clean
Create Date: 2025-09-20 00:03:21.843965

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e15c709dcf8d'
down_revision: Union[str, None] = 'add_clients_table_clean'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check and add created_at and updated_at columns to topics table (modules already has them)
    op.add_column('topics', sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    op.add_column('topics', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))

    # Add created_at and updated_at columns to subtopics table
    op.add_column('subtopics', sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    op.add_column('subtopics', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))

    # Add created_at and updated_at columns to content_blocks table
    op.add_column('content_blocks', sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    op.add_column('content_blocks', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))

    # Create triggers to automatically update the updated_at column when records are modified
    # Note: This is PostgreSQL-specific trigger syntax

    # Modules trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION update_modules_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_modules_updated_at
        BEFORE UPDATE ON modules
        FOR EACH ROW
        EXECUTE FUNCTION update_modules_updated_at();
    """)

    # Topics trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION update_topics_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_topics_updated_at
        BEFORE UPDATE ON topics
        FOR EACH ROW
        EXECUTE FUNCTION update_topics_updated_at();
    """)

    # Subtopics trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION update_subtopics_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_subtopics_updated_at
        BEFORE UPDATE ON subtopics
        FOR EACH ROW
        EXECUTE FUNCTION update_subtopics_updated_at();
    """)

    # Content blocks trigger
    op.execute("""
    CREATE OR REPLACE FUNCTION update_content_blocks_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_content_blocks_updated_at
        BEFORE UPDATE ON content_blocks
        FOR EACH ROW
        EXECUTE FUNCTION update_content_blocks_updated_at();
    """)


def downgrade() -> None:
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS update_modules_updated_at ON modules")
    op.execute("DROP FUNCTION IF EXISTS update_modules_updated_at()")

    op.execute("DROP TRIGGER IF EXISTS update_topics_updated_at ON topics")
    op.execute("DROP FUNCTION IF EXISTS update_topics_updated_at()")

    op.execute("DROP TRIGGER IF EXISTS update_subtopics_updated_at ON subtopics")
    op.execute("DROP FUNCTION IF EXISTS update_subtopics_updated_at()")

    op.execute("DROP TRIGGER IF EXISTS update_content_blocks_updated_at ON content_blocks")
    op.execute("DROP FUNCTION IF EXISTS update_content_blocks_updated_at()")

    # Drop columns (modules already had timestamps, so we don't drop those)
    op.drop_column('content_blocks', 'updated_at')
    op.drop_column('content_blocks', 'created_at')
    op.drop_column('subtopics', 'updated_at')
    op.drop_column('subtopics', 'created_at')
    op.drop_column('topics', 'updated_at')
    op.drop_column('topics', 'created_at')
