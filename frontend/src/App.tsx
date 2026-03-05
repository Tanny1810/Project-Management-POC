import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import AssignmentPage from "./pages/AssignmentPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="content">
        <Routes>
          <Route path="/" element={<AssignmentPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
