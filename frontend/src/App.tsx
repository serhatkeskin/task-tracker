import { useAuth } from "./auth/context";
import Board from "./pages/Board";
import Login from "./pages/Login";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>;
  }
  return user ? <Board /> : <Login />;
}
