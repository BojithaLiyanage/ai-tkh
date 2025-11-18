"""create_quiz_tables

Revision ID: m1n2o3p4q5r6
Revises: 43dd6c27aa54
Create Date: 2025-11-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'm1n2o3p4q5r6'
down_revision: Union[str, None] = '43dd6c27aa54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create quiz_attempts table
    op.create_table(
        'quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('fiber_id', sa.Integer(), nullable=False),
        sa.Column('study_group_code', sa.String(1), nullable=False),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['fiber_id'], ['fibers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['study_group_code'], ['study_groups.code']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for quiz_attempts
    op.create_index('idx_quiz_attempts_user_id', 'quiz_attempts', ['user_id'])
    op.create_index('idx_quiz_attempts_fiber_id', 'quiz_attempts', ['fiber_id'])
    op.create_index('idx_quiz_attempts_user_fiber', 'quiz_attempts', ['user_id', 'fiber_id'])

    # Create quiz_answers table
    op.create_table(
        'quiz_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_attempt_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('selected_answer', sa.String(500), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['quiz_attempt_id'], ['quiz_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for quiz_answers
    op.create_index('idx_quiz_answers_attempt_id', 'quiz_answers', ['quiz_attempt_id'])
    op.create_index('idx_quiz_answers_question_id', 'quiz_answers', ['question_id'])


def downgrade() -> None:
    # Drop indexes for quiz_answers
    op.drop_index('idx_quiz_answers_question_id', 'quiz_answers')
    op.drop_index('idx_quiz_answers_attempt_id', 'quiz_answers')

    # Drop quiz_answers table
    op.drop_table('quiz_answers')

    # Drop indexes for quiz_attempts
    op.drop_index('idx_quiz_attempts_user_fiber', 'quiz_attempts')
    op.drop_index('idx_quiz_attempts_fiber_id', 'quiz_attempts')
    op.drop_index('idx_quiz_attempts_user_id', 'quiz_attempts')

    # Drop quiz_attempts table
    op.drop_table('quiz_attempts')
