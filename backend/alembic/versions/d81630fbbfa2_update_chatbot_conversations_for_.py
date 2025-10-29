"""update chatbot_conversations for message chain

Revision ID: d81630fbbfa2
Revises: 831fbbdca909
Create Date: 2025-10-05 01:12:34.230535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd81630fbbfa2'
down_revision: Union[str, None] = '831fbbdca909'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old columns if they exist
    op.execute("ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS question CASCADE")
    op.execute("ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS answer CASCADE")
    op.execute("ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS response_time_ms CASCADE")

    # Add new columns
    op.add_column('chatbot_conversations', sa.Column('messages', sa.dialects.postgresql.JSONB(), nullable=False, server_default='[]'))
    op.add_column('chatbot_conversations', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True))
    op.add_column('chatbot_conversations', sa.Column('started_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True))
    op.add_column('chatbot_conversations', sa.Column('ended_at', sa.DateTime(), nullable=True))

    # Add unique constraint to session_id
    op.create_unique_constraint('uq_chatbot_conversations_session_id', 'chatbot_conversations', ['session_id'])


def downgrade() -> None:
    # Remove unique constraint
    op.drop_constraint('uq_chatbot_conversations_session_id', 'chatbot_conversations', type_='unique')

    # Drop new columns
    op.drop_column('chatbot_conversations', 'ended_at')
    op.drop_column('chatbot_conversations', 'started_at')
    op.drop_column('chatbot_conversations', 'is_active')
    op.drop_column('chatbot_conversations', 'messages')

    # Add back old columns
    op.add_column('chatbot_conversations', sa.Column('question', sa.Text(), nullable=False))
    op.add_column('chatbot_conversations', sa.Column('answer', sa.Text(), nullable=False))
    op.add_column('chatbot_conversations', sa.Column('response_time_ms', sa.Integer(), nullable=True))
