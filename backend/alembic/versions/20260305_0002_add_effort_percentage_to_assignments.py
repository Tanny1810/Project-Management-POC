"""add effort percentage to assignments

Revision ID: 20260305_0002
Revises: 20260305_0001
Create Date: 2026-03-05 00:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260305_0002"
down_revision: Union[str, Sequence[str], None] = "20260305_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "assignments",
        sa.Column("effort_percentage", sa.Integer(), nullable=False, server_default="100"),
    )
    op.create_check_constraint(
        "ck_assignments_effort_percentage_valid",
        "assignments",
        "effort_percentage > 0 AND effort_percentage <= 100",
    )
    op.alter_column("assignments", "effort_percentage", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_assignments_effort_percentage_valid", "assignments", type_="check")
    op.drop_column("assignments", "effort_percentage")
