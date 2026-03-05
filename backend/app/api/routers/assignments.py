import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dates import add_months
from app.dependencies.database import get_db_session
from app.models.assignment import Assignment
from app.models.employee import Employee
from app.models.project import Project
from app.models.task import Task
from app.schemas.assignment import AssignmentCreate, AssignmentRead

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _ranges_overlap(start_a: dt.date, end_a: dt.date, start_b: dt.date, end_b: dt.date) -> bool:
    return start_a < end_b and start_b < end_a


def _split_stack_values(value: str) -> set[str]:
    return {item.strip().lower() for item in value.split(",") if item.strip()}


def _ensure_employee_bandwidth(db: Session, payload: AssignmentCreate) -> None:
    new_start = payload.start_date
    new_end = add_months(payload.start_date, payload.duration_months)

    existing_assignments = db.scalars(select(Assignment).where(Assignment.employee_id == payload.employee_id)).all()
    checkpoints: set[dt.date] = {new_start}
    for assignment in existing_assignments:
        assignment_start = assignment.start_date
        assignment_end = add_months(assignment.start_date, assignment.duration_months)

        if not _ranges_overlap(new_start, new_end, assignment_start, assignment_end):
            continue

        if new_start <= assignment_start < new_end:
            checkpoints.add(assignment_start)
        if new_start < assignment_end < new_end:
            checkpoints.add(assignment_end)

    for checkpoint in checkpoints:
        active_effort = payload.effort_percentage
        for assignment in existing_assignments:
            assignment_end = add_months(assignment.start_date, assignment.duration_months)
            if assignment.start_date <= checkpoint < assignment_end:
                active_effort += assignment.effort_percentage

        if active_effort > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Employee bandwidth exceeded for overlapping period: "
                    f"{active_effort}% at {checkpoint} (max 100%)"
                ),
            )


def _ensure_assignment_within_task_and_project(payload: AssignmentCreate, task: Task, project: Project) -> None:
    assignment_start = payload.start_date
    assignment_end = add_months(payload.start_date, payload.duration_months)

    # End is exclusive in overlap logic; convert task/project end to exclusive by adding one day.
    task_end_exclusive = task.end_date + dt.timedelta(days=1)
    project_end_exclusive = project.end_date + dt.timedelta(days=1)

    if assignment_start < task.start_date or assignment_end > task_end_exclusive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment timeline must be within selected task timeline",
        )

    if assignment_start < project.start_date or assignment_end > project_end_exclusive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment timeline must be within parent project timeline",
        )


def _ensure_employee_stack_matches_task(employee: Employee, task: Task) -> None:
    required = task.required_stack.strip().lower()
    if not required:
        return

    employee_stack = _split_stack_values(employee.tech_stack)
    if required not in employee_stack:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee tech stack does not match task required stack",
        )


@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db_session)) -> Assignment:
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    task = db.get(Task, payload.task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    project = db.get(Project, task.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    _ensure_employee_stack_matches_task(employee, task)
    _ensure_assignment_within_task_and_project(payload, task, project)
    _ensure_employee_bandwidth(db, payload)

    assignment = Assignment(**payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("", response_model=list[AssignmentRead])
def list_assignments(db: Session = Depends(get_db_session)) -> list[Assignment]:
    return list(db.scalars(select(Assignment).order_by(Assignment.id)).all())


@router.get("/{assignment_id}", response_model=AssignmentRead)
def get_assignment(assignment_id: int, db: Session = Depends(get_db_session)) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db_session)) -> None:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return None
