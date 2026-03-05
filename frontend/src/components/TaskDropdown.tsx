import type { Task } from "../types/task";

type TaskDropdownProps = {
  tasks: Task[];
  value: number | "";
  onChange: (value: number | "") => void;
  disabled?: boolean;
};

export default function TaskDropdown({ tasks, value, onChange, disabled }: TaskDropdownProps) {
  return (
    <div className="field-group">
      <label htmlFor="task-select">Task</label>
      <select
        id="task-select"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next ? Number(next) : "");
        }}
      >
        <option value="">Select a task</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
    </div>
  );
}
