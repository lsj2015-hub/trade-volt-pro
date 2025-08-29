"""add broker_id to holdings table

Revision ID: 3b63496be4c2
Revises: 151b5be6bb4c
Create Date: 2025-08-29 10:06:54.946487

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b63496be4c2'
down_revision: Union[str, None] = '151b5be6bb4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
