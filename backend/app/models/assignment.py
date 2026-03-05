import datetime as dt

from sqlalchemy import CheckConstraint, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (
        CheckConstraint("duration_months > 0", name="ck_assignments_duration_months_positive"),
        CheckConstraint("effort_percentage > 0 AND effort_percentage <= 100", name="ck_assignments_effort_percentage_valid"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    duration_months: Mapped[int] = mapped_column(nullable=False)
    effort_percentage: Mapped[int] = mapped_column(nullable=False, default=100)
    start_date: Mapped[dt.date] = mapped_column(Date, nullable=False)

    employee = relationship("Employee", back_populates="assignments")
    task = relationship("Task", back_populates="assignments")
