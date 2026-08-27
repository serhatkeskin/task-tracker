import type { Task } from "../api/types";
import TaskRow from "./TaskRow";

interface Props {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
}

export default function TaskList({ tasks, loading, error, onToggle, onOpen }: Props) {
  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }
  if (loading && tasks.length === 0) {
    return <p className="p-4 text-sm text-slate-500">Loading tasks…</p>;
  }
  if (tasks.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No tasks match these filters.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} />
      ))}
    </ul>
  );
}
