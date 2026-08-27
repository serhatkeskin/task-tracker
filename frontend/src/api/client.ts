const BASE_URL = import.meta.env.VITE_API_URL || "";

const ACCESS_KEY = "tt.access";
const REFRESH_KEY = "tt.refresh";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(typeof data === "string" ? data : `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }

  /** Flattens DRF's {field: message} or {field: [message]} shape into one line. */
  get detail(): string {
    const data = this.data as Record<string, unknown> | null;
    if (!data || typeof data !== "object") return this.message;
    const parts: string[] = [];
    for (const [field, value] of Object.entries(data)) {
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      parts.push(field === "detail" || field === "non_field_errors" ? text : `${field}: ${text}`);
    }
    return parts.join(" · ") || this.message;
  }
}

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);

function setTokens(access: string | null, refresh?: string | null) {
  accessToken = access;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  const response = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    setTokens(null, null);
    return false;
  }
  const data = await response.json();
  setTokens(data.access);
  return true;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && retry && (await refreshAccessToken())) {
    return request<T>(method, path, body, false);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  del: (path: string) => request<void>("DELETE", path),

  getAccessToken: () => accessToken,

  async login(username: string, password: string) {
    const response = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, payload);
    setTokens(payload.access, payload.refresh);
  },

  logout() {
    setTokens(null, null);
  },
};
