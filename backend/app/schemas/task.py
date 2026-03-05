from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    project_id: int
    title: str
    description: str | None = None
    status: str = "open"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    project_id: int | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
