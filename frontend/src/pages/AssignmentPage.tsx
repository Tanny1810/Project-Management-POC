import { useEffect, useMemo, useState } from "react";
import EmployeeTable from "../components/EmployeeTable";
import ProjectDropdown from "../components/ProjectDropdown";
import TaskDropdown from "../components/TaskDropdown";
import {
  assignEmployee,
  getEmployeeAvailability,
  getProjects,
  getTasks,
} from "../services/api";
import type { EmployeeWithAvailability } from "../types/employee";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

export default function AssignmentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAvailability[]>([]);

  const [projectId, setProjectId] = useState<number | "">("");
  const [taskId, setTaskId] = useState<number | "">("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (projectId === "") {
        setTasks([]);
        setTaskId("");
        return;
      }

      try {
        const data = await getTasks(projectId);
        setTasks(data);
        setTaskId("");
      } catch (err) {
        setError((err as Error).message);
      }
    }
    loadTasks();
  }, [projectId]);

  useEffect(() => {
    async function loadEmployees() {
      if (taskId === "") {
        setEmployees([]);
        return;
      }

      setIsLoading(true);
      setError("");
      setMessage("");

      try {
        const data = await getEmployeeAvailability();
        setEmployees(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployees();
  }, [taskId]);

  const selectedTask = useMemo(() => tasks.find((task) => task.id === taskId), [tasks, taskId]);

  async function handleAssign(employeeId: number, durationMonths: number, effortPercentage: number) {
    if (taskId === "") {
      return;
    }

    setError("");
    setMessage("");

    try {
      await assignEmployee({
        employee_id: employeeId,
        task_id: taskId,
        duration_months: durationMonths,
        effort_percentage: effortPercentage,
        start_date: new Date().toISOString().slice(0, 10),
      });

      setMessage("Employee assigned successfully.");
      const updatedEmployees = await getEmployeeAvailability();
      setEmployees(updatedEmployees);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section>
      <h2>Task Assignment</h2>
      <div className="controls-row">
        <ProjectDropdown projects={projects} value={projectId} onChange={setProjectId} />
        <TaskDropdown tasks={tasks} value={taskId} onChange={setTaskId} disabled={projectId === ""} />
      </div>

      {selectedTask ? <p className="hint">Selected Task: {selectedTask.title}</p> : null}
      {isLoading ? <p>Loading employees...</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {taskId !== "" ? <EmployeeTable employees={employees} taskId={taskId} onAssign={handleAssign} /> : null}
    </section>
  );
}
