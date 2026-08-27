import type { Priority, Status, TaskFilters, User } from "../api/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../api/types";

interface Props {
  filters: TaskFilters;
  members: User[];
  resultCount: number;
  onChange: (next: TaskFilters) => void;
  onReset: () => void;
}

const ORDERINGS: Array<[string, string]> = [
  ["-created_at", "Newest first"],
  ["created_at", "Oldest first"],
  ["due_date", "Due soonest"],
  ["priority", "Highest priority"],
  ["title", "Title A–Z"],
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function FilterBar({ filters, members, resultCount, onChange, onReset }: Props) {
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      active
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search title and description…"
          className="min-w-56 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <select
          value={filters.ordering}
          onChange={(e) => onChange({ ...filters, ordering: e.target.value })}
          aria-label="Sort order"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {ORDERINGS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onReset} className="text-xs text-slate-500 underline">
          Reset
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((status: Status) => (
          <button
            key={status}
            type="button"
            className={chip(filters.status.includes(status))}
            onClick={() => onChange({ ...filters, status: toggle(filters.status, status) })}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        {PRIORITIES.map((priority: Priority) => (
          <button
            key={priority}
            type="button"
            className={chip(filters.priority.includes(priority))}
            onClick={() => onChange({ ...filters, priority: toggle(filters.priority, priority) })}
          >
            {PRIORITY_LABELS[priority]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            className={chip(filters.assigned_to.includes(String(member.id)))}
            onClick={() =>
              onChange({
                ...filters,
                assigned_to: toggle(filters.assigned_to, String(member.id)),
              })
            }
          >
            {member.display_name}
          </button>
        ))}
        <button
          type="button"
          className={chip(filters.assigned_to.includes("unassigned"))}
          onClick={() =>
            onChange({ ...filters, assigned_to: toggle(filters.assigned_to, "unassigned") })
          }
        >
          Unassigned
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          className={chip(filters.overdue)}
          onClick={() => onChange({ ...filters, overdue: !filters.overdue })}
        >
          Overdue only
        </button>
        <span className="ml-auto text-xs text-slate-500">{resultCount} tasks</span>
      </div>
    </div>
  );
}
