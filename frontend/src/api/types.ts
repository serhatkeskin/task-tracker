export type Status = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export const STATUSES: Status[] = ["todo", "in_progress", "done"];
export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export const STATUS_LABELS: Record<Status, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
}

export interface Workspace {
  id: number;
  name: string;
  admin: User;
  members: User[];
  created_at: string;
}

export interface Task {
  id: number;
  workspace: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assigned_to: User | null;
  created_by: User;
  is_complete: boolean;
  is_overdue: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task: number;
  body: string;
  created_by: User;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TaskFilters {
  q: string;
  status: Status[];
  priority: Priority[];
  assigned_to: string[]; // user ids as strings, plus the literal "unassigned"
  overdue: boolean;
  ordering: string;
}

export const EMPTY_FILTERS: TaskFilters = {
  q: "",
  status: [],
  priority: [],
  assigned_to: [],
  overdue: false,
  ordering: "-created_at",
};
