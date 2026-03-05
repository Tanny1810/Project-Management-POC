import { useMemo, useState } from "react";
import type { EmployeeWithAvailability } from "../types/employee";

type EmployeeTableProps = {
  employees: EmployeeWithAvailability[];
  taskId: number | "";
  onAssign: (employeeId: number, durationMonths: number, effortPercentage: number) => Promise<void>;
};

export default function EmployeeTable({ employees, taskId, onAssign }: EmployeeTableProps) {
  const [durationMap, setDurationMap] = useState<Record<number, string>>({});
  const [loadingEmployeeId, setLoadingEmployeeId] = useState<number | null>(null);

  const isTaskSelected = taskId !== "";

  const rows = useMemo(() => employees, [employees]);

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Role</th>
            <th>Current Bandwidth Usage (%)</th>
            <th>Available Bandwidth (%)</th>
            <th>Assign Duration (months)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6}>No employees found.</td>
            </tr>
          ) : (
            rows.map((employee) => {
              const durationValue = durationMap[employee.id] ?? "1";
              const available = employee.availability.available_percentage;
              const current = employee.availability.allocation_percentage;
              const canAssign = isTaskSelected && available > 0;

              return (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{current}%</td>
                  <td>{available}%</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={durationValue}
                      onChange={(event) =>
                        setDurationMap((prev) => ({
                          ...prev,
                          [employee.id]: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      disabled={!canAssign || loadingEmployeeId === employee.id}
                      onClick={async () => {
                        const duration = Number(durationValue);
                        if (!Number.isFinite(duration) || duration <= 0) {
                          alert("Please enter a valid duration.");
                          return;
                        }

                        setLoadingEmployeeId(employee.id);
                        try {
                          await onAssign(employee.id, duration, available);
                        } finally {
                          setLoadingEmployeeId(null);
                        }
                      }}
                    >
                      {loadingEmployeeId === employee.id ? "Assigning..." : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <p className="hint">
        Assign action uses employee's currently available bandwidth as effort percentage.
      </p>
    </div>
  );
}
