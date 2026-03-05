import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import AssignmentPage from "./pages/AssignmentPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeePage";
import ProjectPage from "./pages/ProjectPage";
import TaskPage from "./pages/TaskPage";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/assignments" replace />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/employees" element={<EmployeePage />} />
          <Route path="/assignments" element={<AssignmentPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/assignments" replace />} />
        </Routes>
      </main>
    </div>
  );
}
