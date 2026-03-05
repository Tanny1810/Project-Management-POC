from app.api.routers.assignments import router as assignments_router
from app.api.routers.employees import router as employees_router
from app.api.routers.projects import router as projects_router
from app.api.routers.tasks import router as tasks_router

__all__ = ["employees_router", "projects_router", "tasks_router", "assignments_router"]
