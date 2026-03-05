export interface Assignment {
  id: number;
  employee_id: number;
  task_id: number;
  duration_months: number;
  effort_percentage: number;
  start_date: string;
}

export interface AssignmentCreatePayload {
  employee_id: number;
  task_id: number;
  duration_months: number;
  effort_percentage: number;
  start_date: string;
}

export type AssignmentResponse = Assignment;
