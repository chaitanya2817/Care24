import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

function getBaseUrl(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}

async function apiFetch(path: string, options?: RequestInit, token?: string | null) {
  const base = getBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${base}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(body.error || "Request failed"), { status: res.status, data: body });
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      const rt = localStorage.getItem("careai_refresh_token");
      if (!rt) return;
      try {
        const data = await apiFetch("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: rt }),
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem("careai_refresh_token", data.refreshToken);
        scheduleRefresh(data.accessToken);
      } catch {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("careai_refresh_token");
      }
    }, 12 * 60 * 1000);
  }, []);

  useEffect(() => {
    const rt = localStorage.getItem("careai_refresh_token");
    if (!rt) { setIsLoading(false); return; }
    apiFetch("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: rt }) })
      .then(data => {
        setAccessToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem("careai_refresh_token", data.refreshToken);
        scheduleRefresh(data.accessToken);
      })
      .catch(() => {
        localStorage.removeItem("careai_refresh_token");
      })
      .finally(() => setIsLoading(false));
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [scheduleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("careai_refresh_token", data.refreshToken);
    scheduleRefresh(data.accessToken);
  }, [scheduleRefresh]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("careai_refresh_token", data.refreshToken);
    scheduleRefresh(data.accessToken);
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      if (accessToken) await apiFetch("/auth/logout", { method: "POST" }, accessToken);
    } catch { /* ignore */ }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("careai_refresh_token");
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { apiFetch };
