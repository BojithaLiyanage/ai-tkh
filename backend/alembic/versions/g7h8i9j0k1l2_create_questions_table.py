"""create_questions_table

Revision ID: g7h8i9j0k1l2
Revises: f4a5b6c7d8e9
Create Date: 2025-11-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g7h8i9j0k1l2'
down_revision: Union[str, None] = 'f4a5b6c7d8e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fiber_id', sa.Integer(), nullable=False),
        sa.Column('study_group_code', sa.String(1), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('options', sa.ARRAY(sa.String()), nullable=False),
        sa.Column('correct_answer', sa.String(500), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['fiber_id'], ['fibers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['study_group_code'], ['study_groups.code']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('fiber_id', 'question', name='uq_questions_fiber_question')
    )

    # Create index on fiber_id for faster queries
    op.create_index('idx_questions_fiber_id', 'questions', ['fiber_id'])

    # Create index on study_group_code for faster queries
    op.create_index('idx_questions_study_group_code', 'questions', ['study_group_code'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_questions_study_group_code', 'questions')
    op.drop_index('idx_questions_fiber_id', 'questions')

    # Drop table
    op.drop_table('questions')
