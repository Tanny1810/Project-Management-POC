import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr


class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    role: str


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class EmployeeAvailabilitySummary(BaseModel):
    as_of_date: dt.date
    allocation_percentage: int
    available_percentage: int
    status: str
    next_full_availability_date: dt.date | None = None


class EmployeeAvailabilityRead(EmployeeRead):
    availability: EmployeeAvailabilitySummary
