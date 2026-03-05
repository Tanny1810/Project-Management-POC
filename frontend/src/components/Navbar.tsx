import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <h1>Employee Management</h1>
      <nav>
        <NavLink to="/projects" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Projects
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Tasks
        </NavLink>
        <NavLink to="/employees" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Employees
        </NavLink>
        <NavLink to="/assignments" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Assignment
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Dashboard
        </NavLink>
      </nav>
    </header>
  );
}
