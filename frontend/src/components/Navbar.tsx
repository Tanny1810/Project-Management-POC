import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <h1>Employee Management</h1>
      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Assignment
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Dashboard
        </NavLink>
      </nav>
    </header>
  );
}
