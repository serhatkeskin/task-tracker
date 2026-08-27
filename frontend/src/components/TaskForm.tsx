import { useState } from "react";

import { ApiError } from "../api/client";
import type { Priority, Status, Task, User } from "../api/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../api/types";

interface Props {
  members: User[];
  task?: Task | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
}

const FIELD =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function TaskForm({ members, task, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Status>(task?.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [assignee, setAssignee] = useState(task?.assigned_to ? String(task.assigned_to.id) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
        assigned_to_id: assignee ? Number(assignee) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not save the task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{task ? "Edit task" : "New task"}</h2>

        <label className="block text-sm font-medium text-slate-700">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={FIELD}
            autoFocus
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={FIELD}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className={FIELD}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={FIELD}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Due date
            <input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => setDueDate(e.target.value)}
              className={FIELD}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Assignee
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={FIELD}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
