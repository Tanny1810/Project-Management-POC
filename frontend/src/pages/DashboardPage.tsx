import { useEffect, useMemo, useState } from "react";
import { getAssignments, getEmployees, getProjects, getTasks } from "../services/api";
import type { Assignment } from "../types/assignment";
import type { Employee } from "../types/employee";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

type DashboardRow = {
  assignmentId: number;
  employeeName: string;
  role: string;
  projectName: string;
  taskTitle: string;
  durationMonths: number;
  bandwidthUsed: number;
};

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [assignmentData, employeeData, projectData, taskData] = await Promise.all([
          getAssignments(),
          getEmployees(),
          getProjects(),
          getTasks(),
        ]);

        setAssignments(assignmentData);
        setEmployees(employeeData);
        setProjects(projectData);
        setTasks(taskData);
      } catch (err) {
        setError((err as Error).message);
      }
    }

    loadDashboardData();
  }, []);

  const rows = useMemo<DashboardRow[]>(() => {
    const employeeMap = new Map<number, Employee>(employees.map((employee) => [employee.id, employee]));
    const taskMap = new Map<number, Task>(tasks.map((task) => [task.id, task]));
    const projectMap = new Map<number, Project>(projects.map((project) => [project.id, project]));

    return assignments.map((assignment) => {
      const employee = employeeMap.get(assignment.employee_id);
      const task = taskMap.get(assignment.task_id);
      const project = task ? projectMap.get(task.project_id) : undefined;

      return {
        assignmentId: assignment.id,
        employeeName: employee?.name ?? "Unknown",
        role: employee?.role ?? "Unknown",
        projectName: project?.name ?? "Unknown",
        taskTitle: task?.title ?? "Unknown",
        durationMonths: assignment.duration_months,
        bandwidthUsed: assignment.effort_percentage,
      };
    });
  }, [assignments, employees, tasks, projects]);

  return (
    <section>
      <h2>Employee Workload Dashboard</h2>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Role</th>
              <th>Project</th>
              <th>Task</th>
              <th>Assigned Duration</th>
              <th>Bandwidth Used (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>No assignments available.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.assignmentId}>
                  <td>{row.employeeName}</td>
                  <td>{row.role}</td>
                  <td>{row.projectName}</td>
                  <td>{row.taskTitle}</td>
                  <td>{row.durationMonths} month(s)</td>
                  <td>{row.bandwidthUsed}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
