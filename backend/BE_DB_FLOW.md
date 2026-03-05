# Backend + DB Flow (POC)

## 1. Scope
This document explains what was implemented for the backend (`BE`) and database (`DB`) and how the full backend flow works at runtime.

Tech stack:
- Python 3
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Alembic

## 2. Backend Structure
`backend/app` is organized by responsibility:
- `app/main.py`: FastAPI app creation and router registration.
- `app/core/config.py`: environment-driven settings.
- `app/core/dates.py`: shared date utilities (month arithmetic).
- `app/db/session.py`: SQLAlchemy engine + session factory.
- `app/db/base.py`: declarative base and model metadata loading.
- `app/dependencies/database.py`: DI provider for DB session (`get_db_session`).
- `app/models/*`: SQLAlchemy models.
- `app/schemas/*`: Pydantic request/response schemas.
- `app/api/routers/*`: REST APIs.

## 3. DB Schema Implemented
Tables:
- `employees`
  - `id`, `name`, `email` (unique), `role`
- `projects`
  - `id`, `name`, `description`
- `tasks`
  - `id`, `project_id` (FK -> projects), `title`, `description`, `status`
- `assignments`
  - `id`, `employee_id` (FK -> employees), `task_id` (FK -> tasks),
  - `duration_months` (`> 0`),
  - `effort_percentage` (`1..100`),
  - `start_date`

Key constraints:
- Assignment duration must be positive.
- Assignment effort must be `> 0` and `<= 100`.
- Foreign keys are `ON DELETE CASCADE` to keep referential integrity.

## 4. Alembic Migrations
Migration files:
- `20260305_0001_create_initial_tables.py`: creates base schema.
- `20260305_0002_add_effort_percentage_to_assignments.py`: adds `effort_percentage` and check constraint.

Runtime behavior:
- On BE container startup, Alembic runs `upgrade head`.
- This guarantees schema is current before API starts.

## 5. Seed Data (Idempotent)
Seed SQL: `backend/sql/seed_data.sql`

How it is run:
- `backend/scripts/run_seed.py` executes SQL after migrations.
- BE container startup chain:
  1. `alembic upgrade head`
  2. `python scripts/run_seed.py`
  3. `uvicorn app.main:app ...`

Idempotency approach:
- Employees: `ON CONFLICT (email) DO UPDATE`
- Projects/Tasks/Assignments: `INSERT ... WHERE NOT EXISTS (...)`

## 6. APIs Implemented
### Employees
- `POST /employees`
- `GET /employees`
- `GET /employees/{id}`
- `PUT /employees/{id}`
- `DELETE /employees/{id}`

Availability APIs:
- `GET /employees/availability?as_of_date=YYYY-MM-DD`
- `GET /employees/{id}/availability?as_of_date=YYYY-MM-DD`

Availability response includes:
- `allocation_percentage`
- `available_percentage`
- `status`: `free` | `occupied` | `partially_occupied`
- `next_full_availability_date` (set when currently 100% occupied)

### Projects
- `POST /projects`
- `GET /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`

### Tasks
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/{id}`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

### Assignments
- `POST /assignments`
- `GET /assignments`
- `GET /assignments/{id}`
- `DELETE /assignments/{id}`

## 7. Bandwidth/Availability Logic
### A. On assignment creation
The backend validates:
- Employee exists.
- Task exists.
- Overlapping assignment windows for that employee do not exceed total 100% effort.

If overlapping total effort would exceed 100%, API returns `400` with bandwidth error.

### B. Availability computation
For `as_of_date`:
- Active assignment = `start_date <= as_of_date < end_date`.
- `allocation_percentage` = sum of active assignment efforts.
- `available_percentage` = `100 - allocation` (lower bounded at 0).
- Status:
  - `free` if allocation is 0
  - `occupied` if allocation is 100 or more
  - `partially_occupied` otherwise

If currently occupied (100%), backend searches month-by-month for the first month where allocation drops below 100 and returns that as `next_full_availability_date`.

## 8. End-to-End BE Flow
1. `docker compose up --build`
2. `db` service starts (PostgreSQL).
3. `be` service starts and runs Alembic migrations.
4. `be` runs seed ingestion script.
5. FastAPI app starts and exposes APIs on port `8000`.
6. Request lifecycle for each API call:
   - Router receives request.
   - Pydantic validates payload/query params.
   - DI injects DB session via `Depends(get_db_session)`.
   - Business validation runs (FK checks, email uniqueness, bandwidth checks).
   - SQLAlchemy performs DB read/write.
   - Transaction commits for write operations.
   - Response schema is returned.
   - DB session closes in dependency cleanup.

## 9. Files Most Relevant to Flow
- App bootstrap: `backend/app/main.py`
- Config: `backend/app/core/config.py`
- DB session/engine: `backend/app/db/session.py`
- DB dependency: `backend/app/dependencies/database.py`
- Availability/bandwidth logic:
  - `backend/app/api/routers/employees.py`
  - `backend/app/api/routers/assignments.py`
- Migrations:
  - `backend/alembic/env.py`
  - `backend/alembic/versions/20260305_0001_create_initial_tables.py`
  - `backend/alembic/versions/20260305_0002_add_effort_percentage_to_assignments.py`
- Seed:
  - `backend/sql/seed_data.sql`
  - `backend/scripts/run_seed.py`

## 10. Notes
- Current assignment API supports create/list/get/delete. Update endpoint can be added with same bandwidth checks.
- Frontend service in compose is placeholder; BE+DB flow is fully operational.
