import type { Assignment, AssignmentCreatePayload, AssignmentResponse } from "../types/assignment";
import type { Employee, EmployeeCreatePayload, EmployeeWithAvailability } from "../types/employee";
import type { Project, ProjectCreatePayload } from "../types/project";
import type { Task, TaskCreatePayload } from "../types/task";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export async function createProject(payload: ProjectCreatePayload): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTasks(projectId?: number): Promise<Task[]> {
  const query = projectId ? `?project_id=${projectId}` : "";
  return request<Task[]>(`/tasks${query}`);
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEmployees(requiredStack?: string): Promise<Employee[]> {
  const query = requiredStack ? `?required_stack=${encodeURIComponent(requiredStack)}` : "";
  return request<Employee[]>(`/employees${query}`);
}

export async function createEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
  return request<Employee>("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEmployeeAvailability(asOfDate?: string, requiredStack?: string): Promise<EmployeeWithAvailability[]> {
  const params = new URLSearchParams();
  if (asOfDate) {
    params.set("as_of_date", asOfDate);
  }
  if (requiredStack) {
    params.set("required_stack", requiredStack);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<EmployeeWithAvailability[]>(`/employees/availability${query}`);
}

export async function getAssignments(): Promise<Assignment[]> {
  return request<Assignment[]>("/assignments");
}

export async function assignEmployee(payload: AssignmentCreatePayload): Promise<AssignmentResponse> {
  return request<AssignmentResponse>("/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
