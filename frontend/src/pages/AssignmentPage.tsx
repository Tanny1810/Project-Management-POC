import { useEffect, useMemo, useState } from "react";
import EmployeeTable from "../components/EmployeeTable";
import ProjectDropdown from "../components/ProjectDropdown";
import TaskDropdown from "../components/TaskDropdown";
import { assignEmployee, getEmployeeAvailability, getProjects, getTasks } from "../services/api";
import type { EmployeeWithAvailability } from "../types/employee";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AssignmentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAvailability[]>([]);

  const [projectId, setProjectId] = useState<number | "">("");
  const [taskId, setTaskId] = useState<number | "">("");
  const [assignmentStartDate, setAssignmentStartDate] = useState(todayISO());

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const selectedTask = useMemo(() => tasks.find((task) => task.id === taskId), [tasks, taskId]);

  async function loadProjects() {
    const data = await getProjects();
    setProjects(data);
  }

  async function loadTasks(selectedProjectId: number) {
    const data = await getTasks(selectedProjectId);
    setTasks(data);
  }

  async function loadEmployeesForTask(task: Task, asOfDate: string) {
    const data = await getEmployeeAvailability(asOfDate, task.required_stack);
    setEmployees(data);
  }

  useEffect(() => {
    loadProjects().catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (projectId === "") {
      setTasks([]);
      setTaskId("");
      return;
    }

    loadTasks(projectId)
      .then(() => setTaskId(""))
      .catch((err: Error) => setError(err.message));
  }, [projectId]);

  useEffect(() => {
    async function refreshEmployees() {
      if (!selectedTask) {
        setEmployees([]);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        await loadEmployeesForTask(selectedTask, assignmentStartDate);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    refreshEmployees();
  }, [selectedTask, assignmentStartDate]);

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
        start_date: assignmentStartDate,
      });

      setMessage("Employee assigned successfully.");
      if (selectedTask) {
        await loadEmployeesForTask(selectedTask, assignmentStartDate);
      }
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
        <div className="field-group">
          <label htmlFor="assignment-date">Assignment Start Date</label>
          <input
            id="assignment-date"
            type="date"
            value={assignmentStartDate}
            onChange={(event) => setAssignmentStartDate(event.target.value)}
          />
        </div>
      </div>

      {selectedTask ? (
        <p className="hint">
          Selected Task: {selectedTask.title} | Required Stack: {selectedTask.required_stack} | Timeline: {selectedTask.start_date} to {selectedTask.end_date}
        </p>
      ) : null}
      {isLoading ? <p>Loading employees...</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {taskId !== "" ? <EmployeeTable employees={employees} taskId={taskId} onAssign={handleAssign} /> : null}
    </section>
  );
}
