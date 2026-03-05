import { FormEvent, useEffect, useState } from "react";
import ProjectDropdown from "../components/ProjectDropdown";
import { createTask, getProjects, getTasks } from "../services/api";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(dateText: string, months: number): string {
  const date = new Date(dateText);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < day) {
    date.setDate(0);
  }
  return date.toISOString().slice(0, 10);
}

export default function TaskPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "open",
    required_stack: "",
    start_date: todayISO(),
    end_date: addMonthsISO(todayISO(), 2),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProjects() {
    const data = await getProjects();
    setProjects(data);
  }

  async function loadTasks(selectedProjectId?: number) {
    const data = await getTasks(selectedProjectId);
    setTasks(data);
  }

  useEffect(() => {
    loadProjects().catch((err: Error) => setError(err.message));
    loadTasks().catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (projectId === "") {
      loadTasks().catch((err: Error) => setError(err.message));
      return;
    }
    loadTasks(projectId).catch((err: Error) => setError(err.message));
  }, [projectId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (projectId === "") {
      setError("Please select a project before creating a task.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await createTask({ project_id: projectId, ...form });
      setMessage("Task created successfully and mapped to selected project.");
      await loadTasks(projectId);
      setForm({
        title: "",
        description: "",
        status: "open",
        required_stack: "",
        start_date: todayISO(),
        end_date: addMonthsISO(todayISO(), 2),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const projectMap = new Map<number, Project>(projects.map((project) => [project.id, project]));

  return (
    <section>
      <h2>Tasks</h2>
      <form className="card form-single" onSubmit={handleSubmit}>
        <ProjectDropdown projects={projects} value={projectId} onChange={setProjectId} />
        <input
          placeholder="Task title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
        <input
          placeholder="Status (open/in-progress/done)"
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          required
        />
        <input
          placeholder="Required stack (e.g. .net)"
          value={form.required_stack}
          onChange={(event) => setForm((prev) => ({ ...prev, required_stack: event.target.value }))}
          required
        />
        <label>Start Date</label>
        <input
          type="date"
          value={form.start_date}
          onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))}
          required
        />
        <label>End Date</label>
        <input
          type="date"
          value={form.end_date}
          onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
          required
        />
        <button type="submit">Create Task</button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Title</th>
              <th>Required Stack</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6}>No tasks available.</td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>{projectMap.get(task.project_id)?.name ?? task.project_id}</td>
                  <td>{task.title}</td>
                  <td>{task.required_stack}</td>
                  <td>{task.status}</td>
                  <td>{task.start_date}</td>
                  <td>{task.end_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
