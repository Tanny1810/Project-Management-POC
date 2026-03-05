import datetime as dt

from pydantic import BaseModel, ConfigDict, model_validator


class TaskBase(BaseModel):
    project_id: int
    title: str
    description: str | None = None
    status: str = "open"
    required_stack: str
    start_date: dt.date
    end_date: dt.date

    @model_validator(mode="after")
    def validate_dates(self) -> "TaskBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date")
        return self


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    project_id: int | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    required_stack: str | None = None
    start_date: dt.date | None = None
    end_date: dt.date | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
