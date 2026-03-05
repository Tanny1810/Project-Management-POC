import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dates import add_months
from app.dependencies.database import get_db_session
from app.models.assignment import Assignment
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeAvailabilityRead,
    EmployeeAvailabilitySummary,
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
)

router = APIRouter(prefix="/employees", tags=["employees"])


def _split_stack_values(value: str) -> set[str]:
    return {item.strip().lower() for item in value.split(",") if item.strip()}


def _stack_matches(employee_stack: str, required_stack: str | None) -> bool:
    if not required_stack:
        return True
    return required_stack.strip().lower() in _split_stack_values(employee_stack)


def _is_active_on(assignment: Assignment, as_of_date: dt.date) -> bool:
    end_date = add_months(assignment.start_date, assignment.duration_months)
    return assignment.start_date <= as_of_date < end_date


def _first_day_next_month(value: dt.date) -> dt.date:
    return add_months(value.replace(day=1), 1)


def _calculate_availability(db: Session, employee_id: int, as_of_date: dt.date) -> EmployeeAvailabilitySummary:
    assignments = db.scalars(select(Assignment).where(Assignment.employee_id == employee_id)).all()

    active_assignments = [assignment for assignment in assignments if _is_active_on(assignment, as_of_date)]
    allocation = sum(assignment.effort_percentage for assignment in active_assignments)
    available = max(0, 100 - allocation)

    if allocation == 0:
        status_value = "free"
    elif allocation >= 100:
        status_value = "occupied"
    else:
        status_value = "partially_occupied"

    next_full_availability_date: dt.date | None = None
    if allocation >= 100:
        current = _first_day_next_month(as_of_date)
        for _ in range(36):
            month_allocation = sum(
                assignment.effort_percentage
                for assignment in assignments
                if _is_active_on(assignment, current)
            )
            if month_allocation < 100:
                next_full_availability_date = current
                break
            current = add_months(current, 1)

    return EmployeeAvailabilitySummary(
        as_of_date=as_of_date,
        allocation_percentage=allocation,
        available_percentage=available,
        status=status_value,
        next_full_availability_date=next_full_availability_date,
    )


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db_session)) -> Employee:
    existing = db.scalar(select(Employee).where(Employee.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee email already exists")

    employee = Employee(**payload.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("", response_model=list[EmployeeRead])
def list_employees(required_stack: str | None = Query(default=None), db: Session = Depends(get_db_session)) -> list[Employee]:
    employees = list(db.scalars(select(Employee).order_by(Employee.id)).all())
    return [employee for employee in employees if _stack_matches(employee.tech_stack, required_stack)]


@router.get("/availability", response_model=list[EmployeeAvailabilityRead])
def list_employee_availability(
    as_of_date: dt.date | None = Query(default=None),
    required_stack: str | None = Query(default=None),
    db: Session = Depends(get_db_session),
) -> list[EmployeeAvailabilityRead]:
    evaluation_date = as_of_date or dt.date.today()
    employees = list(db.scalars(select(Employee).order_by(Employee.id)).all())
    response: list[EmployeeAvailabilityRead] = []

    for employee in employees:
        if not _stack_matches(employee.tech_stack, required_stack):
            continue

        availability = _calculate_availability(db, employee.id, evaluation_date)
        response.append(
            EmployeeAvailabilityRead(
                id=employee.id,
                name=employee.name,
                email=employee.email,
                role=employee.role,
                tech_stack=employee.tech_stack,
                availability=availability,
            )
        )

    return response


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db_session)) -> Employee:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.get("/{employee_id}/availability", response_model=EmployeeAvailabilityRead)
def get_employee_availability(
    employee_id: int,
    as_of_date: dt.date | None = Query(default=None),
    db: Session = Depends(get_db_session),
) -> EmployeeAvailabilityRead:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    evaluation_date = as_of_date or dt.date.today()
    availability = _calculate_availability(db, employee_id, evaluation_date)
    return EmployeeAvailabilityRead(
        id=employee.id,
        name=employee.name,
        email=employee.email,
        role=employee.role,
        tech_stack=employee.tech_stack,
        availability=availability,
    )


@router.put("/{employee_id}", response_model=EmployeeRead)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db_session)) -> Employee:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = db.scalar(select(Employee).where(Employee.email == update_data["email"], Employee.id != employee_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee email already exists")

    for field, value in update_data.items():
        setattr(employee, field, value)

    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db_session)) -> None:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    db.delete(employee)
    db.commit()
    return None
