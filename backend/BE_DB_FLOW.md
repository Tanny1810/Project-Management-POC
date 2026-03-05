# Backend + DB Flow (POC)

## 1. Scope
This document explains the current backend and database flow after adding:
- timeline-aware projects/tasks/assignments,
- employee and task tech-stack matching,
- bandwidth-aware assignment rules,
- idempotent seed updates.

Tech stack:
- Python 3
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Alembic

## 2. Backend Structure
`backend/app` is organized by responsibility:
- `app/main.py`: app creation, router registration, CORS setup.
- `app/core/config.py`: environment-driven settings.
- `app/core/dates.py`: month/date utility helpers.
- `app/db/session.py`: SQLAlchemy engine + session factory.
- `app/db/base.py`: declarative base + model metadata loading.
- `app/dependencies/database.py`: DB session dependency.
- `app/models/*`: SQLAlchemy models.
- `app/schemas/*`: request/response schemas.
- `app/api/routers/*`: API endpoints and business validation.

## 3. DB Schema Implemented
### `employees`
- `id`, `name`, `email` (unique), `role`, `tech_stack`

### `projects`
- `id`, `name`, `description`, `start_date`, `end_date`

### `tasks`
- `id`, `project_id` (FK), `title`, `description`, `status`,
- `required_stack`, `start_date`, `end_date`

### `assignments`
- `id`, `employee_id` (FK), `task_id` (FK),
- `duration_months` (`> 0`),
- `effort_percentage` (`1..100`),
- `start_date`

## 4. Key Constraints and Rules
- `projects.end_date >= projects.start_date`
- `tasks.end_date >= tasks.start_date`
- Task timeline must be inside project timeline.
- Assignment timeline must be inside both task and project timelines.
- Assignment bandwidth overlap must never exceed 100%.
- Employee must match task required stack.

## 5. Alembic Migrations
- `20260305_0001_create_initial_tables.py`: base tables
- `20260305_0002_add_effort_percentage_to_assignments.py`: effort percentage
- `20260305_0003_add_timeline_and_stack_fields.py`: timeline + tech-stack fields

Runtime behavior:
- On BE container startup, Alembic runs `upgrade head` before API starts.

## 6. Seed Data (Idempotent)
Seed SQL: `backend/sql/seed_data.sql`

Execution order at container startup:
1. `alembic upgrade head`
2. `python scripts/run_seed.py`
3. `uvicorn app.main:app ...`

Idempotency strategy:
- Employees: `ON CONFLICT(email) DO UPDATE`
- Projects/Tasks: `UPDATE ...` then `INSERT ... WHERE NOT EXISTS`
- Assignments: `INSERT ... WHERE NOT EXISTS`

## 7. APIs and Query Support
### Employees
- `POST /employees`
- `GET /employees`
- `GET /employees/{id}`
- `PUT /employees/{id}`
- `DELETE /employees/{id}`

Filters:
- `GET /employees?required_stack=.net`

Availability:
- `GET /employees/availability?as_of_date=YYYY-MM-DD&required_stack=python`
- `GET /employees/{id}/availability?as_of_date=YYYY-MM-DD`

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

Filters:
- `GET /tasks?project_id=1`

### Assignments
- `POST /assignments`
- `GET /assignments`
- `GET /assignments/{id}`
- `DELETE /assignments/{id}`

## 8. Assignment Validation Flow
On `POST /assignments`, backend validates in this order:
1. Employee exists.
2. Task exists.
3. Parent project exists.
4. Employee tech stack matches task required stack.
5. Assignment window is within task and project windows.
6. Overlap bandwidth at any active checkpoint does not exceed 100%.
7. Save assignment.

If any rule fails, API returns `400` or `404` with validation detail.

## 9. Availability Computation Flow
For an `as_of_date`:
- Active assignment: `start_date <= as_of_date < end_date` (end derived from `start_date + duration_months`).
- `allocation_percentage` = sum(active efforts)
- `available_percentage` = `100 - allocation`
- status:
  - `free` (0)
  - `partially_occupied` (1..99)
  - `occupied` (100)
- If occupied, system searches month-by-month for the first month with `<100%` allocation and returns `next_full_availability_date`.

## 10. End-to-End Runtime Flow
1. `docker compose up --build`
2. `db` (PostgreSQL) starts and becomes healthy.
3. `be` starts.
4. Alembic migrates to latest revision.
5. Seed script runs.
6. FastAPI serves APIs on `:8000`.
7. Frontend calls APIs (`:3000` -> `:8000`) via CORS-enabled backend.

Per API request:
- Router receives request.
- Pydantic validates payload/query.
- DB session injected via `Depends(get_db_session)`.
- Domain validations run.
- SQLAlchemy read/write + commit.
- Response returned; DB session closed.

## 11. Frontend Interaction Flow (Current)
Assignment page now supports:
- Create Project (with start/end dates)
- Create Employee (with tech stack)
- Create Task (with required stack and timeline, under selected project)
- Select project -> select task -> pick assignment start date
- Employee table fetches filtered availability by selected task required stack
- Assign action posts assignment with selected start date and computed effort

Dashboard page shows joined workload using:
- `GET /assignments`
- `GET /employees`
- `GET /projects`
- `GET /tasks`

## 12. Files Most Relevant
- App bootstrap: `backend/app/main.py`
- Models:
  - `backend/app/models/employee.py`
  - `backend/app/models/project.py`
  - `backend/app/models/task.py`
  - `backend/app/models/assignment.py`
- Routers:
  - `backend/app/api/routers/employees.py`
  - `backend/app/api/routers/projects.py`
  - `backend/app/api/routers/tasks.py`
  - `backend/app/api/routers/assignments.py`
- Migrations:
  - `backend/alembic/versions/20260305_0001_create_initial_tables.py`
  - `backend/alembic/versions/20260305_0002_add_effort_percentage_to_assignments.py`
  - `backend/alembic/versions/20260305_0003_add_timeline_and_stack_fields.py`
- Seed and runner:
  - `backend/sql/seed_data.sql`
  - `backend/scripts/run_seed.py`
