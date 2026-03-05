# Employee Management System POC

## 1. Problem Statement

Organizations often run multiple projects simultaneously, each consisting of several tasks that require different technical expertise. Managers need a structured way to assign employees with specific technical roles (such as Backend, Frontend, QA, UI/UX, or DevOps) to these tasks for defined durations.

The goal of this system is to build an **Employee Management Application** that enables managers to:

- Create and manage projects.
- Define tasks under each project.
- Assign technical employees to specific tasks.
- Track the duration of assignments in months.
- Ensure employees are **only assigned to tasks and not directly to projects**.

This structure allows for **clear ownership of work, efficient resource allocation, and better visibility into employee workload across tasks and projects.**

---

# 2. Goal

Build a **containerized full-stack application** that allows managers to manage projects, tasks, and employee assignments.

The system should demonstrate:

- A **project → task hierarchy**
- **task-level employee assignment**
- **duration-based allocation**
- **role-based employees**
- **clean backend architecture**
- **API-driven frontend integration**

The goal of this POC is to validate the **system architecture and core workflows**, not to build a fully production-ready system.

---

# 3. Core System Rules

The system must enforce the following rules:

1. Projects contain multiple tasks.
2. Employees cannot be assigned to projects directly.
3. Employees can only be assigned to **tasks**.
4. Assignments must include a **duration (in months)**.
5. Each employee has a **technical role** such as:
   - Backend Engineer
   - Frontend Engineer
   - QA Engineer
   - UI Designer
   - UX Designer
   - DevOps Engineer

---

# 4. Tech Stack

## Backend

- **Language:** Python 3
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Validation:** Pydantic

Responsibilities:

- Expose REST APIs
- Handle business logic
- Manage employee assignments
- Store project/task data
- Enforce assignment rules

---

## Frontend

- **Language:** TypeScript
- **Framework:** React
- **State Management:** React Query / Context API
- **UI Library:** Optional (Material UI / Tailwind)

Responsibilities:

- Display projects and tasks
- Assign employees to tasks
- Show assignment durations
- Display employee workload

---

## Infrastructure

The system will run using **Docker containers**.

Each major component will run in **separate containers**.

Services:

- frontend
- backend
- postgres

Container responsibilities:

| Service | Description |
|--------|-------------|
| backend | FastAPI application |
| frontend | React application |
| postgres | PostgreSQL database |

These services will be orchestrated using **Docker Compose**.

---

# 5. High-Level Architecture

      +-------------+
      |  Frontend   |
      |   React     |
      +-------------+
             |
             | REST API
             |
      +-------------+
      |  FastAPI    |
      |   Backend   |
      +-------------+
             |
             |
      +-------------+
      | PostgreSQL  |
      |   Database  |
      +-------------+

---

# 6. Core Entities

## Employee

Represents a technical employee.

Fields:
- id
- name
- email
- role
- created_at


Notes:
- Each employee has a **specific technical role** (Backend, Frontend, QA, UI, UX, DevOps).
- An employee can be assigned to **multiple tasks over time**.
- Assignment duration is controlled through the **Assignment entity**.

---

## Project

Represents a project within the organization.

Fields:
- id
- name
- description
- status
- created_at
- updated_at


Notes:
- A project can contain **multiple tasks**.
- Employees **cannot be assigned directly to projects**.

---

## Task

Represents a unit of work within a project.

Fields:
- id
- project_id
- title
- description
- status
- created_at
- updated_at

Notes:
- Each task belongs to **exactly one project**.
- Employees are assigned to **tasks**, not projects.

---

## Assignment

Represents the allocation of an employee to a specific task for a defined duration.

Fields:
 - id
 - employee_id
 - task_id
 - duration_months
 - start_date
 - end_date

Rules:

- An employee **can only be assigned to tasks**.
- Assignment duration is defined in **months**.
- An employee **may have multiple assignments**, but overlapping rules can be enforced later.

Relationship overview:

    Project
    │
    └── Task
    │
    └── Assignment
    │
    └── Employee

---

# 7. Core APIs

## Employee APIs

Create and manage employees.
POST /employees
GET /employees
GET /employees/{id}
PUT /employees/{id}
DELETE /employees/{id}

---
Example request:


POST /employees

{
"name": "Alice Smith",
"email": "alice@example.com
",
"role": "Backend Engineer"
}


---

## Project APIs

Manage projects.


POST /projects
GET /projects
GET /projects/{id}
PUT /projects/{id}
DELETE /projects/{id}


### Example request:


POST /projects

{
"name": "Customer Portal",
"description": "Internal portal for customer management"
}


---

## Task APIs

Manage tasks under projects.


POST /tasks
GET /tasks
GET /tasks/{id}
PUT /tasks/{id}
DELETE /tasks/{id}


### Example request:


POST /tasks

{
"project_id": 1,
"title": "Build authentication service",
"description": "Develop login and JWT authentication",
"status": "open"
}


---

## Assignment APIs

Manage employee assignments to tasks.


POST /assignments
GET /assignments
GET /assignments/{id}
DELETE /assignments/{id}


### Example request:


POST /assignments

{
"employee_id": 2,
"task_id": 5,
"duration_months": 3,
"start_date": "2026-03-01"
}