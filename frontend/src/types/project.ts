export interface Project {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
}

export interface ProjectCreatePayload {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}
