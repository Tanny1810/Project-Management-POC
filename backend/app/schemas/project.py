import datetime as dt

from pydantic import BaseModel, ConfigDict, model_validator


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    start_date: dt.date
    end_date: dt.date

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date")
        return self


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: dt.date | None = None
    end_date: dt.date | None = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
