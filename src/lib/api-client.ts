const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:5001/api/v1';

// In-memory token — never persisted to localStorage for security
let _authToken: string | null = null;
let _onUnauthorized: (() => void) | null = null;

// Single in-flight refresh promise so concurrent 401s don't spawn multiple refresh calls
let _refreshPromise: Promise<void> | null = null;
// Once a refresh fails, block all further refresh attempts until login succeeds
let _refreshFailed = false;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

/** Call before login to clear the refresh-failed gate. */
export function resetRefreshState(): void {
  _refreshFailed = false;
  _refreshPromise = null;
}

/** True when `url` points at our own API, the only place the token belongs. */
export function isApiUrl(url: string): boolean {
  try {
    return (
      new URL(url, window.location.href).origin === new URL(BASE_URL).origin
    );
  } catch {
    return false;
  }
}

export function getAuthToken(): string | null {
  return _authToken;
}

export function onUnauthorized(callback: () => void): void {
  _onUnauthorized = callback;
}

function authHeaders(): Record<string, string> {
  return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
}

async function parseError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: {
      message?: string;
      details?: { field?: string; message?: string }[];
    };
  };
  const baseMsg =
    body.error?.message ?? body.message ?? `Request failed: ${res.status}`;
  const details = body.error?.details;
  if (details?.length) {
    const fieldErrors = details
      .map(d => (d.field ? `${d.field}: ${d.message}` : d.message))
      .filter(Boolean)
      .join('; ');
    return fieldErrors ? `${baseMsg}: ${fieldErrors}` : baseMsg;
  }
  return baseMsg;
}

/**
 * Distinguishes a server decision from a transport problem.
 *
 * "Definitive" means the refresh endpoint answered and REJECTED us — so the
 * refresh cookie is genuinely gone and the session cannot be recovered. A 5xx or
 * a thrown fetch (offline, DNS, a redeploy mid-flight) is NOT definitive: the
 * session may still be valid, so we must not sign the user out.
 */
export class RefreshFailedError extends Error {
  readonly definitive: boolean;
  /** The 401 from the endpoint that triggered the refresh attempt. */
  readonly original401?: Response;
  constructor(definitive: boolean, original401?: Response) {
    super('Refresh failed');
    this.name = 'RefreshFailedError';
    this.definitive = definitive;
    this.original401 = original401;
  }
}

/**
 * Exchange the httpOnly refresh cookie for a new access token.
 *
 * `original401` is the response that triggered this attempt; it is carried so
 * the caller can report the real server error rather than a generic
 * "Refresh failed".
 */
async function silentRefresh(original401?: Response): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    // 401/403 = the server actively rejected the refresh cookie → the session is
    // over. Anything else (5xx, 429, …) is transient and must NOT end the
    // session, otherwise a backend restart logs every user out.
    throw new RefreshFailedError(
      res.status === 401 || res.status === 403,
      original401
    );
  }
  const body = (await res.json()) as {
    success?: boolean;
    data?: { accessToken?: string };
    accessToken?: string;
  };
  // Support both envelope-wrapped and flat response shapes
  const token = body.data?.accessToken ?? body.accessToken;
  if (!token) throw new RefreshFailedError(false, original401);
  setAuthToken(token);
}

/**
 * Execute a fetch factory. On 401 → attempt one silent token refresh, then retry.
 * If refresh also fails, call onUnauthorized and throw.
 */
async function withRefresh<T>(
  factory: () => Promise<Response>,
  silent = false
): Promise<T> {
  // After a failed refresh, reject immediately — don't hit the server at all
  if (_refreshFailed && !silent) {
    throw new Error('Session expired. Please log in again.');
  }

  // If a refresh is already in-flight, wait for it before firing the request.
  // This prevents a flood of requests with an expired token hitting the server.
  if (_refreshPromise && !silent) {
    try {
      await _refreshPromise;
    } catch (err) {
      // Only claim the session expired if it actually did. A transient refresh
      // failure must not tell the user to log in again — the session is intact.
      // (`_refreshFailed` may already have been re-opened by the logout that the
      // first caller triggered, so the error itself is checked as well.)
      const sessionEnded =
        _refreshFailed || (err instanceof RefreshFailedError && err.definitive);
      throw new Error(
        sessionEnded
          ? 'Session expired. Please log in again.'
          : (err as Error).message,
        { cause: err }
      );
    }
  }

  let res = await factory();

  if (res.status === 401 && !silent && !_refreshFailed) {
    // Deduplicate: if a refresh is already in flight, wait for it
    if (!_refreshPromise) {
      _refreshPromise = silentRefresh(res).finally(() => {
        _refreshPromise = null;
      });
    }
    try {
      await _refreshPromise;
    } catch (err) {
      // Only end the session when the server DEFINITIVELY rejected the refresh
      // cookie. On a transient failure we leave the session intact and surface
      // the original request's error so the caller can retry later.
      const definitive = err instanceof RefreshFailedError && err.definitive;
      if (definitive && !_refreshFailed) {
        _refreshFailed = true;
        // Clear the stale token FIRST: the onUnauthorized handler only tears the
        // session down when there is no token, and until now the old access token
        // was still in place — so the handler could never fire and an expired
        // session was never ended. Clearing it here also stops the app from
        // sending a token we know is dead.
        setAuthToken(null);
        _onUnauthorized?.();
      }
      // Report the real server error where we have it, not a generic message.
      const asRefreshError = err instanceof RefreshFailedError;
      throw new Error(
        asRefreshError && err.original401
          ? await parseError(err.original401)
          : (err as Error).message,
        { cause: err }
      );
    }
    // Retry original request with the new token
    res = await factory();
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json()) as unknown;
  // Check for explicit success:false in the response envelope
  if (
    body !== null &&
    typeof body === 'object' &&
    'success' in (body as object) &&
    (body as { success: boolean }).success === false
  ) {
    const err = (body as { error?: { message?: string } }).error;
    throw new Error(err?.message ?? 'Request failed');
  }
  // Unwrap the standard { success: true, data: T } envelope
  if (
    body !== null &&
    typeof body === 'object' &&
    'success' in (body as object) &&
    'data' in (body as object)
  ) {
    const inner = (body as { data: T }).data;
    const meta = (body as Record<string, unknown>).meta;
    // List responses: { data: [...], meta: { total, page, ... } } → merge into { data, ...meta }
    if (meta && typeof meta === 'object' && Array.isArray(inner)) {
      return { data: inner, ...(meta as object) } as T;
    }
    return inner;
  }
  return body as T;
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      search.set(key, String(val));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

export function getJson<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  return withRefresh<T>(() =>
    fetch(buildUrl(path, params), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      cache: 'no-store',
    })
  );
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return withRefresh<T>(() =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      credentials: 'include',
    })
  );
}

/** Silent variant — 401s do NOT trigger refresh or the global unauthorized handler. */
export function postJsonSilent<T>(path: string, body: unknown): Promise<T> {
  return withRefresh<T>(
    () =>
      fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
        credentials: 'include',
      }),
    true // silent
  );
}

/**
 * Public variant — no auth headers and no refresh on 401.
 * Use for endpoints that must work anonymously (forgot-password, reset-password,
 * verify-email) even when the user happens to have a session token in memory.
 */
export function postJsonPublic<T>(path: string, body: unknown): Promise<T> {
  return withRefresh<T>(
    () =>
      fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      }),
    true // silent — don't trigger refresh on 401
  );
}

export function postForm<T>(path: string, formData: FormData): Promise<T> {
  return withRefresh<T>(() =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
      credentials: 'include',
    })
  );
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return withRefresh<T>(() =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      credentials: 'include',
    })
  );
}

export function deleteJson<T>(path: string): Promise<T> {
  return withRefresh<T>(() =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
    })
  );
}
