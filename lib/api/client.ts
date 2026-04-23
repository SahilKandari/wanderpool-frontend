const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let fields: Record<string, string> | undefined;
    try {
      const data = await res.json();
      message = data.error ?? data.message ?? message;
      if (data.fields && typeof data.fields === "object") {
        fields = data.fields;
      }
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message, fields);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Called from client components — reads JWT from the BFF cookie via /api/auth/token */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // The BFF route handler forwards the cookie-based token to the Go backend.
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}

/** Called from server components / route handlers — passes the token directly */
export async function serverFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}

/** Public fetch — no auth header */
export async function publicFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return handleResponse<T>(res);
}
