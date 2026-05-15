function getBaseUrl(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}

export async function apiCall<T = unknown>(
  path: string,
  options?: RequestInit,
  token?: string | null
): Promise<T> {
  const base = getBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base}/api${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body.error || "Request failed") as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = body;
    throw err;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

let retryCount = 0;
const MAX_RETRIES = 3;

export async function apiCallWithRetry<T = unknown>(
  path: string,
  options?: RequestInit,
  token?: string | null
): Promise<T> {
  retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    try {
      return await apiCall<T>(path, options, token);
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status && e.status < 500) throw err;
      retryCount++;
      if (retryCount >= MAX_RETRIES) throw err;
      await new Promise(r => setTimeout(r, 500 * retryCount));
    }
  }
  throw new Error("Max retries exceeded");
}
