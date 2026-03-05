from fastapi import FastAPI

from app.api.routers import assignments_router, employees_router, projects_router, tasks_router
from app.core.config import settings


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.1.0",
    )

    app.include_router(employees_router)
    app.include_router(projects_router)
    app.include_router(tasks_router)
    app.include_router(assignments_router)

    return app


app = create_application()
