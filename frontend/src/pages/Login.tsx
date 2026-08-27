import { useState } from "react";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/context";

const DEMO_ACCOUNTS = ["admin", "alice", "bob", "carol", "dave"];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("alice");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Task Tracker</h1>
          <p className="text-sm text-slate-500">Sign in with a demo account.</p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account}
              type="button"
              onClick={() => {
                setUsername(account);
                setPassword(account === "admin" ? "admin" : "demo12345");
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              {account}
            </button>
          ))}
        </div>

      </form>
    </div>
  );
}
