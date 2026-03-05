-- Idempotent seed data for Employee Management POC.
-- Safe to run multiple times.

-- Employees
INSERT INTO employees (name, email, role)
VALUES
  ('Alice Smith', 'alice@example.com', 'Backend Engineer'),
  ('Bob Johnson', 'bob@example.com', 'Frontend Engineer'),
  ('Carol Davis', 'carol@example.com', 'QA Engineer'),
  ('Dev Mehta', 'dev@example.com', 'DevOps Engineer')
ON CONFLICT (email)
DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Projects
INSERT INTO projects (name, description)
SELECT 'Customer Portal', 'Internal portal for customer management'
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE name = 'Customer Portal'
);

INSERT INTO projects (name, description)
SELECT 'Mobile App Revamp', 'Redesign and rebuild core mobile app flows'
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE name = 'Mobile App Revamp'
);

-- Tasks
INSERT INTO tasks (project_id, title, description, status)
SELECT p.id, 'Build authentication service', 'Develop login and JWT authentication', 'open'
FROM projects p
WHERE p.name = 'Customer Portal'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.project_id = p.id
      AND t.title = 'Build authentication service'
  );

INSERT INTO tasks (project_id, title, description, status)
SELECT p.id, 'Create customer dashboard UI', 'Implement dashboard and responsive layout', 'open'
FROM projects p
WHERE p.name = 'Customer Portal'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.project_id = p.id
      AND t.title = 'Create customer dashboard UI'
  );

INSERT INTO tasks (project_id, title, description, status)
SELECT p.id, 'Add regression test suite', 'Automate smoke and regression test cases', 'open'
FROM projects p
WHERE p.name = 'Mobile App Revamp'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.project_id = p.id
      AND t.title = 'Add regression test suite'
  );

-- Assignments
-- Scenario coverage:
-- 1) Alice: unassigned -> 100% available.
-- 2) Bob: 100% occupied in March 2026 -> available from April 2026.
-- 3) Carol: 50% allocated -> 50% available for other tasks.

INSERT INTO assignments (employee_id, task_id, duration_months, effort_percentage, start_date)
SELECT e.id, t.id, 1, 100, DATE '2026-03-01'
FROM employees e
JOIN tasks t ON t.title = 'Create customer dashboard UI'
WHERE e.email = 'bob@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.employee_id = e.id
      AND a.task_id = t.id
      AND a.start_date = DATE '2026-03-01'
  );

INSERT INTO assignments (employee_id, task_id, duration_months, effort_percentage, start_date)
SELECT e.id, t.id, 3, 50, DATE '2026-03-01'
FROM employees e
JOIN tasks t ON t.title = 'Add regression test suite'
WHERE e.email = 'carol@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.employee_id = e.id
      AND a.task_id = t.id
      AND a.start_date = DATE '2026-03-01'
  );
