import type { Project } from "../types/project";

type ProjectDropdownProps = {
  projects: Project[];
  value: number | "";
  onChange: (value: number | "") => void;
};

export default function ProjectDropdown({ projects, value, onChange }: ProjectDropdownProps) {
  return (
    <div className="field-group">
      <label htmlFor="project-select">Project</label>
      <select
        id="project-select"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next ? Number(next) : "");
        }}
      >
        <option value="">Select a project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
