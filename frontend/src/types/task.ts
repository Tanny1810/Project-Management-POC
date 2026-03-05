export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
}
