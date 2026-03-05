import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


class AssignmentBase(BaseModel):
    employee_id: int
    task_id: int
    duration_months: int = Field(ge=1)
    effort_percentage: int = Field(default=100, ge=1, le=100)
    start_date: dt.date


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentRead(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
