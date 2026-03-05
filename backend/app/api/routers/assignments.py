import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dates import add_months
from app.dependencies.database import get_db_session
from app.models.assignment import Assignment
from app.models.employee import Employee
from app.models.task import Task
from app.schemas.assignment import AssignmentCreate, AssignmentRead

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _ranges_overlap(start_a: dt.date, end_a: dt.date, start_b: dt.date, end_b: dt.date) -> bool:
    return start_a < end_b and start_b < end_a


def _ensure_employee_bandwidth(db: Session, payload: AssignmentCreate) -> None:
    new_start = payload.start_date
    new_end = add_months(payload.start_date, payload.duration_months)

    existing_assignments = db.scalars(
        select(Assignment).where(Assignment.employee_id == payload.employee_id)
    ).all()

    overlapping_effort = 0
    for assignment in existing_assignments:
        assignment_end = add_months(assignment.start_date, assignment.duration_months)
        if _ranges_overlap(new_start, new_end, assignment.start_date, assignment_end):
            overlapping_effort += assignment.effort_percentage

    total_effort = overlapping_effort + payload.effort_percentage
    if total_effort > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Employee bandwidth exceeded for overlapping period: "
                f"requested total {total_effort}% (max 100%)"
            ),
        )


@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db_session)) -> Assignment:
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    task = db.get(Task, payload.task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

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
