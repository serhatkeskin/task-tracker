import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, api } from "../api/client";
import type { Paginated, Task, TaskFilters } from "../api/types";

function toQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.status.length) params.set("status", filters.status.join(","));
  if (filters.priority.length) params.set("priority", filters.priority.join(","));
  if (filters.assigned_to.length) params.set("assigned_to", filters.assigned_to.join(","));
  if (filters.overdue) params.set("overdue", "true");
  params.set("ordering", filters.ordering);
  return params.toString();
}

export function useTasks(workspaceId: number | null, filters: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A mirror of `tasks` that is readable synchronously; written via commit().
  const tasksRef = useRef<Task[]>([]);
  // Guards against an older in-flight response overwriting a newer one.
  const requestId = useRef(0);

  const commit = useCallback((next: Task[], nextCount?: number) => {
    tasksRef.current = next;
    setTasks(next);
    if (nextCount !== undefined) setCount(nextCount);
  }, []);

  const refetch = useCallback(async () => {
    if (workspaceId === null) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const query = toQueryString(filters);
      const page = await api.get<Paginated<Task>>(
        `/api/workspaces/${workspaceId}/tasks/?${query}`,
      );
      if (id !== requestId.current) return;
      commit(page.results, page.count);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof ApiError ? err.detail : "Could not load tasks.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [workspaceId, filters, commit]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void refetch();
  }, [refetch]);

  const createTask = useCallback(
    async (body: Record<string, unknown>) => {
      if (workspaceId === null) return;
      await api.post<Task>(`/api/workspaces/${workspaceId}/tasks/`, body);
      await refetch();
    },
    [workspaceId, refetch],
  );

  const updateTask = useCallback(
    async (id: number, body: Record<string, unknown>) => {
      // Optimistic: apply locally, roll the row back if the server disagrees.
      const previous = tasksRef.current;
      commit(previous.map((task) => (task.id === id ? ({ ...task, ...body } as Task) : task)));
      try {
        const updated = await api.patch<Task>(`/api/tasks/${id}/`, body);
        commit(tasksRef.current.map((task) => (task.id === id ? updated : task)));
        return updated;
      } catch (err) {
        commit(previous);
        throw err;
      }
    },
    [commit],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      const remaining = tasksRef.current.filter((task) => task.id !== id);
      commit(remaining, remaining.length);
      await api.del(`/api/tasks/${id}/`);
    },
    [commit],
  );

  const applyEvent = useCallback(
    (type: string, payload: unknown) => {
      const current = tasksRef.current;

      if (type === "task.deleted") {
        const { id } = (payload ?? {}) as { id?: number };
        if (id === undefined || !current.some((task) => task.id === id)) return;
        const remaining = current.filter((task) => task.id !== id);
        commit(remaining, remaining.length);
        return;
      }

      if (type === "comment.created") {
        const comment = payload as { task?: number };
        if (comment?.task) {
          commit(
            current.map((task) =>
              task.id === comment.task
                ? { ...task, comment_count: (task.comment_count ?? 0) + 1 }
                : task,
            ),
          );
        }
        return;
      }

      if (type === "comment.deleted") {
        const comment = payload as { task_id?: number };
        if (comment?.task_id) {
          commit(
            current.map((task) =>
              task.id === comment.task_id
                ? { ...task, comment_count: Math.max(0, (task.comment_count ?? 1) - 1) }
                : task,
            ),
          );
        }
        return;
      }

      if (type === "task.created" || type === "task.updated") {
        const incoming = payload as Task;
        const index = current.findIndex((task) => task.id === incoming.id);
        if (index === -1) {
          const next = [incoming, ...current];
          commit(next, next.length);
        } else {
          commit(current.map((task, i) => (i === index ? incoming : task)));
        }
      }
    },
    [commit],
  );

  return {
    tasks,
    count,
    loading,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    applyEvent,
  };
}
