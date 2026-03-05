import type {
  Assignment,
  AssignmentCreatePayload,
  AssignmentResponse,
} from "../types/assignment";
import type { Employee, EmployeeWithAvailability } from "../types/employee";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

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

export async function getTasks(projectId?: number): Promise<Task[]> {
  const tasks = await request<Task[]>("/tasks");
  if (!projectId) {
    return tasks;
  }
  return tasks.filter((task) => task.project_id === projectId);
}

export async function getEmployees(): Promise<Employee[]> {
  return request<Employee[]>("/employees");
}

export async function getEmployeeAvailability(): Promise<EmployeeWithAvailability[]> {
  return request<EmployeeWithAvailability[]>("/employees/availability");
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
