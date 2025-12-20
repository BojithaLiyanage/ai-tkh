"""questions_many_to_many_study_groups

Revision ID: 37e2a63c44ab
Revises: d552e916cfa0
Create Date: 2025-12-19 02:03:07.156939

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37e2a63c44ab'
down_revision: Union[str, None] = 'd552e916cfa0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the junction table for many-to-many relationship
    op.execute('''
        CREATE TABLE question_study_groups (
            question_id INTEGER NOT NULL,
            study_group_code CHAR(1) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (question_id, study_group_code),
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
            FOREIGN KEY (study_group_code) REFERENCES study_groups(code) ON DELETE CASCADE
        )
    ''')

    # Migrate existing data from questions.study_group_code to junction table
    op.execute('''
        INSERT INTO question_study_groups (question_id, study_group_code)
        SELECT id, study_group_code
        FROM questions
        WHERE study_group_code IS NOT NULL
    ''')

    # Drop the old foreign key constraint and column
    # Note: If this fails due to permissions, the DBA will need to run it manually
    op.execute('ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_study_group_code_fkey')
    op.execute('DROP INDEX IF EXISTS idx_questions_study_group_code')
    op.execute('ALTER TABLE questions DROP COLUMN IF EXISTS study_group_code')


def downgrade() -> None:
    # Add back the study_group_code column
    op.execute('ALTER TABLE questions ADD COLUMN study_group_code CHAR(1)')

    # Migrate data back (only the first study group for each question)
    op.execute('''
        UPDATE questions q
        SET study_group_code = (
            SELECT study_group_code
            FROM question_study_groups qsg
            WHERE qsg.question_id = q.id
            LIMIT 1
        )
    ''')

    # Add back the foreign key
    op.execute('''
        ALTER TABLE questions
        ADD CONSTRAINT questions_study_group_code_fkey
        FOREIGN KEY (study_group_code) REFERENCES study_groups(code)
    ''')

    # Add back the index
    op.execute('CREATE INDEX idx_questions_study_group_code ON questions(study_group_code)')

    # Drop the junction table
    op.execute('DROP TABLE question_study_groups')
