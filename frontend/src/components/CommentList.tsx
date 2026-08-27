import { useEffect, useState } from "react";

import { ApiError, api } from "../api/client";
import type { Comment, Paginated } from "../api/types";
import { useAuth } from "../auth/context";

interface Props {
  taskId: number;
  socketEvent?: { type: string; payload: unknown; id: number } | null;
}

export default function CommentList({ taskId, socketEvent }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Paginated<Comment>>(`/api/tasks/${taskId}/comments/`)
      .then((page) => {
        if (!cancelled) setComments(page.results);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load comments.");
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (!socketEvent) return;
    const { type, payload } = socketEvent;

    if (type === "comment.created") {
      const created = payload as Comment;
      if (created.task === taskId) {
        setComments((current) =>
          current.some((c) => c.id === created.id) ? current : [...current, created],
        );
      }
    } else if (type === "comment.deleted") {
      const { id, task_id } = payload as { id: number; task_id: number };
      if (task_id === taskId) {
        setComments((current) => current.filter((c) => c.id !== id));
      }
    }
  }, [socketEvent, taskId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Comment>(`/api/tasks/${taskId}/comments/`, {
        body: body.trim(),
      });
      setComments((current) =>
        current.some((c) => c.id === created.id) ? current : [...current, created],
      );
      setBody("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not post the comment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(commentId: number) {
    setDeletingId(commentId);
    setError(null);
    try {
      await api.del(`/api/comments/${commentId}/`);
      setComments((current) => current.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not delete comment.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      <ul className="space-y-2">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="group relative rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100/70"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">
                {comment.created_by.display_name}
                <span className="ml-2 font-normal text-slate-400">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </p>
              {user?.id === comment.created_by.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="text-xs text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
                  title="Delete comment"
                >
                  {deletingId === comment.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-800">{comment.body}</p>
          </li>
        ))}
        {comments.length === 0 && <li className="text-sm text-slate-400">No comments yet.</li>}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  );
}

