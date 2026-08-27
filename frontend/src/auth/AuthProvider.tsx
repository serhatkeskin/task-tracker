import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { api } from "../api/client";
import type { User } from "../api/types";
import { AuthContext } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(api.getAccessToken()));

  useEffect(() => {
    if (!api.getAccessToken()) return;
    api
      .get<User>("/api/auth/me/")
      .then(setUser)
      .catch(() => api.logout())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    await api.login(username, password);
    setUser(await api.get<User>("/api/auth/me/"));
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}
