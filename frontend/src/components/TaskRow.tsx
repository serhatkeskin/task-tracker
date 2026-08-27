import type { Task } from "../api/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../api/types";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
}

export default function TaskRow({ task, onToggle, onOpen }: Props) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={task.is_complete}
        onChange={() => onToggle(task)}
        aria-label={`Mark ${task.title} as ${task.is_complete ? "incomplete" : "complete"}`}
        className="mt-1 size-4 shrink-0 accent-slate-900"
      />

      <button type="button" onClick={() => onOpen(task)} className="flex-1 text-left">
        <span
          className={`block text-sm font-medium ${
            task.is_complete ? "text-slate-400 line-through" : "text-slate-900"
          }`}
        >
          {task.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className={`rounded-full px-2 py-0.5 ${PRIORITY_STYLES[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span>{STATUS_LABELS[task.status]}</span>
          <span aria-hidden>·</span>
          <span>{task.assigned_to ? task.assigned_to.display_name : "Unassigned"}</span>
          {task.due_date && (
            <>
              <span aria-hidden>·</span>
              <span className={task.is_overdue ? "font-medium text-red-600" : ""}>
                {task.is_overdue ? "Overdue " : "Due "}
                {task.due_date}
              </span>
            </>
          )}
          {task.comment_count > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>
                {task.comment_count} comment{task.comment_count === 1 ? "" : "s"}
              </span>
            </>
          )}
        </span>
      </button>
    </li>
  );
}
