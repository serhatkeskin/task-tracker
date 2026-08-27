import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import type { Paginated, Task, TaskFilters, Workspace } from "../api/types";
import { EMPTY_FILTERS } from "../api/types";
import { useAuth } from "../auth/context";
import FilterBar from "../components/FilterBar";
import TaskDetail from "../components/TaskDetail";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import ToastContainer, { type ToastMessage } from "../components/Toast";
import { useDebounce } from "../hooks/useDebounce";
import { useTaskSocket } from "../hooks/useTaskSocket";
import { useTasks } from "../hooks/useTasks";

export default function Board() {
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  // undefined = no panel, null = new task, Task = editing that task
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: "info" | "success" | "warning" = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    api.get<Paginated<Workspace>>("/api/workspaces/").then((page) => {
      setWorkspaces(page.results);
      setWorkspaceId(page.results[0]?.id ?? null);
    });
  }, []);

  // Only the text input is debounced; chips apply immediately.
  const debouncedQuery = useDebounce(filters.q, 300);
  const effectiveFilters = useMemo(
    () => ({ ...filters, q: debouncedQuery }),
    [filters, debouncedQuery],
  );

  const { tasks, count, loading, error, createTask, updateTask, deleteTask, applyEvent } =
    useTasks(workspaceId, effectiveFilters);

  const [socketEvent, setSocketEvent] = useState<{
    type: string;
    payload: unknown;
    id: number;
  } | null>(null);

  const handleSocketEvent = useCallback(
    (type: string, payload: unknown) => {
      applyEvent(type, payload);
      setSocketEvent({ type, payload, id: Date.now() });

      if (type === "task.updated") {
        const task = payload as Task;
        addToast(`Task "${task.title}" was updated.`, "warning");
      } else if (type === "task.created") {
        const task = payload as Task;
        addToast(`New task created: "${task.title}"`, "info");
      } else if (type === "task.deleted") {
        addToast("A task was deleted.", "info");
      } else if (type === "comment.created") {
        const comment = payload as { body?: string; created_by?: { display_name?: string } };
        const author = comment.created_by?.display_name ?? "A team member";
        addToast(`New comment by ${author}.`, "info");
      } else if (type === "comment.deleted") {
        addToast("A comment was deleted.", "info");
      }
    },
    [applyEvent, addToast],
  );

  const { connected } = useTaskSocket(workspaceId, handleSocketEvent);

  const workspace = workspaces.find((item) => item.id === workspaceId) ?? null;
  const members = useMemo(() => workspace?.members ?? [], [workspace]);

  // Keep open task in sync if it gets updated remotely
  const activeEditingTask = useMemo(() => {
    if (!editing) return editing;
    return tasks.find((item) => item.id === editing.id) ?? editing;
  }, [editing, tasks]);

  async function toggleComplete(task: Task) {
    await updateTask(task.id, {
      status: task.is_complete ? "todo" : "done",
      // Mirrored locally so the checkbox flips before the response lands.
      is_complete: !task.is_complete,
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="text-base font-semibold text-slate-900">Task Tracker</h1>
          <select
            value={workspaceId ?? ""}
            onChange={(e) => setWorkspaceId(Number(e.target.value))}
            aria-label="Workspace"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span
            className={`ml-auto flex items-center gap-1.5 text-xs ${
              connected ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <span
              className={`size-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
            />
            {connected ? "Live" : "Offline"}
          </span>
          <span className="text-sm text-slate-500">{user?.display_name}</span>
          <button onClick={logout} className="text-sm text-slate-500 underline">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <FilterBar
          filters={filters}
          members={members}
          resultCount={count}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />

        <button
          onClick={() => setEditing(null)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          New task
        </button>

        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onToggle={toggleComplete}
          onOpen={(task) => setEditing(task)}
        />
      </main>

      {editing === null && (
        <TaskForm
          members={members}
          task={null}
          onClose={() => setEditing(undefined)}
          onSubmit={createTask}
        />
      )}

      {activeEditingTask && (
        <TaskDetail
          task={activeEditingTask}
          members={members}
          socketEvent={socketEvent}
          onClose={() => setEditing(undefined)}
          onSave={(body) => updateTask(activeEditingTask.id, body)}
          onDelete={() => deleteTask(activeEditingTask.id)}
        />
      )}
    </div>
  );
}
