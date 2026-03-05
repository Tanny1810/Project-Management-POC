export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface EmployeeAvailability {
  as_of_date: string;
  allocation_percentage: number;
  available_percentage: number;
  status: "free" | "occupied" | "partially_occupied";
  next_full_availability_date: string | null;
}

export interface EmployeeWithAvailability extends Employee {
  availability: EmployeeAvailability;
}
