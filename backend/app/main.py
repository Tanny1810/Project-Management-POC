from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import assignments_router, employees_router, projects_router, tasks_router
from app.core.config import settings


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(employees_router)
    app.include_router(projects_router)
    app.include_router(tasks_router)
    app.include_router(assignments_router)

    return app


app = create_application()
