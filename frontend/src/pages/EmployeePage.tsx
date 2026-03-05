import { FormEvent, useEffect, useState } from "react";
import { createEmployee, getEmployees } from "../services/api";
import type { Employee } from "../types/employee";

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    tech_stack: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadEmployees() {
    const data = await getEmployees();
    setEmployees(data);
  }

  useEffect(() => {
    loadEmployees().catch((err: Error) => setError(err.message));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await createEmployee(form);
      setMessage("Employee created successfully.");
      await loadEmployees();
      setForm({ name: "", email: "", role: "", tech_stack: "" });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section>
      <h2>Employees</h2>
      <form className="card form-single" onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          placeholder="Role"
          value={form.role}
          onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          required
        />
        <input
          placeholder="Tech stack (e.g. python,.net)"
          value={form.tech_stack}
          onChange={(event) => setForm((prev) => ({ ...prev, tech_stack: event.target.value }))}
          required
        />
        <button type="submit">Create Employee</button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Tech Stack</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4}>No employees available.</td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.role}</td>
                  <td>{employee.tech_stack}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
