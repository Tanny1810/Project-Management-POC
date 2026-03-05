"""add timeline and stack fields

Revision ID: 20260305_0003
Revises: 20260305_0002
Create Date: 2026-03-05 01:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260305_0003"
down_revision: Union[str, Sequence[str], None] = "20260305_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column("tech_stack", sa.String(length=255), nullable=False, server_default="general"),
    )
    op.alter_column("employees", "tech_stack", server_default=None)

    op.add_column(
        "projects",
        sa.Column("start_date", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
    )
    op.add_column(
        "projects",
        sa.Column("end_date", sa.Date(), nullable=False, server_default=sa.text("(CURRENT_DATE + INTERVAL '12 months')")),
    )
    op.create_check_constraint(
        "ck_projects_end_after_start",
        "projects",
        "end_date >= start_date",
    )
    op.alter_column("projects", "start_date", server_default=None)
    op.alter_column("projects", "end_date", server_default=None)

    op.add_column(
        "tasks",
        sa.Column("required_stack", sa.String(length=255), nullable=False, server_default="general"),
    )
    op.add_column(
        "tasks",
        sa.Column("start_date", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
    )
    op.add_column(
        "tasks",
        sa.Column("end_date", sa.Date(), nullable=False, server_default=sa.text("(CURRENT_DATE + INTERVAL '3 months')")),
    )
    op.create_check_constraint(
        "ck_tasks_end_after_start",
        "tasks",
        "end_date >= start_date",
    )
    op.alter_column("tasks", "required_stack", server_default=None)
    op.alter_column("tasks", "start_date", server_default=None)
    op.alter_column("tasks", "end_date", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_tasks_end_after_start", "tasks", type_="check")
    op.drop_column("tasks", "end_date")
    op.drop_column("tasks", "start_date")
    op.drop_column("tasks", "required_stack")

    op.drop_constraint("ck_projects_end_after_start", "projects", type_="check")
    op.drop_column("projects", "end_date")
    op.drop_column("projects", "start_date")

    op.drop_column("employees", "tech_stack")
