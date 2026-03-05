import { FormEvent, useEffect, useState } from "react";
import { createProject, getProjects } from "../services/api";
import type { Project } from "../types/project";

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

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: todayISO(),
    end_date: addMonthsISO(todayISO(), 6),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProjects() {
    const data = await getProjects();
    setProjects(data);
  }

  useEffect(() => {
    loadProjects().catch((err: Error) => setError(err.message));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await createProject(form);
      setMessage("Project created successfully.");
      await loadProjects();
      setForm({
        name: "",
        description: "",
        start_date: todayISO(),
        end_date: addMonthsISO(todayISO(), 6),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section>
      <h2>Projects</h2>
      <form className="card form-single" onSubmit={handleSubmit}>
        <input
          placeholder="Project name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
        <button type="submit">Create Project</button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4}>No projects available.</td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.description ?? "-"}</td>
                  <td>{project.start_date}</td>
                  <td>{project.end_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
