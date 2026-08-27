import { useEffect, useRef, useState } from "react";

import { ApiError } from "../api/client";
import type { Priority, Status, Task, User } from "../api/types";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../api/types";
import CommentList from "./CommentList";

interface Props {
  task: Task;
  members: User[];
  socketEvent?: { type: string; payload: unknown; id: number } | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<unknown>;
  onDelete: () => Promise<void>;
}

const FIELD =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function TaskDetail({
  task,
  members,
  socketEvent,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<Status>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assignee, setAssignee] = useState(task.assigned_to ? String(task.assigned_to.id) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);

  const prevUpdatedAtRef = useRef(task.updated_at);

  useEffect(() => {
    if (task.updated_at !== prevUpdatedAtRef.current) {
      setPendingTask(task);
    }
  }, [task]);

  function reloadLatest() {
    if (!pendingTask) return;
    setTitle(pendingTask.title);
    setDescription(pendingTask.description);
    setStatus(pendingTask.status);
    setPriority(pendingTask.priority);
    setDueDate(pendingTask.due_date ?? "");
    setAssignee(pendingTask.assigned_to ? String(pendingTask.assigned_to.id) : "");
    prevUpdatedAtRef.current = pendingTask.updated_at;
    setPendingTask(null);
  }

  function dismissNotice() {
    if (pendingTask) {
      prevUpdatedAtRef.current = pendingTask.updated_at;
    }
    setPendingTask(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
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
    <div className="fixed inset-0 z-20 flex justify-end bg-slate-900/40">
      <aside className="flex h-full w-full max-w-lg flex-col gap-5 overflow-y-auto bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Task detail</h2>
          <button onClick={onClose} className="text-sm text-slate-500">
            Close
          </button>
        </div>

        {pendingTask && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 shadow-sm">
            <div className="flex items-start gap-2.5">
              <svg
                className="mt-0.5 size-5 shrink-0 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1 font-medium leading-snug">
                This task was modified by another session.
                <p className="mt-1 text-xs text-amber-700 font-normal">
                  Refreshing will load the latest data, but any unsaved changes you made in this form will be lost.
                </p>
              </div>
              <button
                type="button"
                onClick={dismissNotice}
                className="text-amber-500 hover:text-amber-800 p-0.5 text-xs font-semibold"
                aria-label="Dismiss warning"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={reloadLatest}
                className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors shadow-sm"
              >
                Reload latest data
              </button>
              <button
                type="button"
                onClick={dismissNotice}
                className="rounded border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Keep my changes
              </button>
            </div>
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
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
                value={dueDate}
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

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await onDelete();
                onClose();
              }}
              className="ml-auto rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </form>

        <hr className="border-slate-100" />
        <CommentList taskId={task.id} socketEvent={socketEvent} />
      </aside>
    </div>
  );
}
