export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  required_stack: string;
  start_date: string;
  end_date: string;
}

export interface TaskCreatePayload {
  project_id: number;
  title: string;
  description: string;
  status: string;
  required_stack: string;
  start_date: string;
  end_date: string;
}
