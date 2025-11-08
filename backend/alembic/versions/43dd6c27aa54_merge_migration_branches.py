"""merge migration branches

Revision ID: 43dd6c27aa54
Revises: 3df0bd74a50d, g7h8i9j0k1l2
Create Date: 2025-11-08 23:39:45.579334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '43dd6c27aa54'
down_revision: Union[str, None] = ('3df0bd74a50d', 'g7h8i9j0k1l2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
