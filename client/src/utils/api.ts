// Centralized API Client & Safe Data-Shape Helpers for SETU Frontend

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 25000;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  error?: string;
}

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Unwraps the backend's `{ success, message, data }` envelope while remaining compatible
 * with raw JSON payloads.
 */
export const unwrapData = <T = any>(payload: any): T | null => {
  if (payload === null || payload === undefined) return null;
  if (
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'data' in payload &&
    ('success' in payload || 'message' in payload)
  ) {
    return payload.data as T;
  }
  return payload as T;
};

/**
 * Safely extracts an array from API responses, handling both raw arrays and wrapped
 * `{ success, data: [...] }` / `{ success, data: { results: [...] } }` shapes.
 */
export const extractArray = <T = any>(
  payload: any,
  nestedKeys: string[] = ['results', 'items', 'records']
): T[] => {
  if (Array.isArray(payload)) return payload;
  const unwrapped = unwrapData(payload);
  if (Array.isArray(unwrapped)) return unwrapped;

  if (unwrapped && typeof unwrapped === 'object') {
    for (const key of nestedKeys) {
      if (Array.isArray((unwrapped as any)[key])) {
        return (unwrapped as any)[key];
      }
    }
  }

  if (payload && typeof payload === 'object') {
    for (const key of nestedKeys) {
      if (Array.isArray((payload as any)[key])) {
        return (payload as any)[key];
      }
    }
  }

  return [];
};

/**
 * Safely normalizes string-or-array fields (such as targetAudience or skills) into a string[].
 */
export const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Safely formats an opportunity or profile location whether stored as a string or `{ city, state }`.
 */
export const formatLocation = (location: any, fallback = 'India'): string => {
  if (!location) return fallback;
  if (typeof location === 'string') return location.trim() || fallback;
  if (typeof location === 'object') {
    const parts = [location.city, location.state].filter(
      (part) => typeof part === 'string' && part.trim().length > 0
    );
    return parts.length > 0 ? parts.join(', ') : fallback;
  }
  return fallback;
};

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any; error?: string }> => {
  const url = getApiUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>)
  };

  // Attach stored JWT Bearer token if present (essential for cross-origin Netlify <-> Render requests)
  const token = localStorage.getItem('setu_auth_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    ...options,
    method,
    headers,
    credentials: 'include' // Required for HttpOnly cookies
  };

  const execute = async (): Promise<Response> => {
    const res = await fetchWithTimeout(url, requestInit);
    // Gracefully retry once on Render cold-start gateway statuses for idempotent GET calls
    if (method === 'GET' && (res.status === 502 || res.status === 503 || res.status === 504)) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      return fetchWithTimeout(url, requestInit);
    }
    return res;
  };

  try {
    const res = await execute();
    const contentType = res.headers.get('content-type') || '';

    // Guard against non-JSON responses (e.g. Netlify index.html fallback or Render cold-start 502/503 HTML)
    if (!contentType.includes('application/json')) {
      let friendlyMessage = 'Backend server is currently waking up or unavailable. Please try again shortly.';
      if (res.status === 500) {
        friendlyMessage = 'The server encountered an issue. Please try again shortly.';
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: friendlyMessage
      };
    }

    // Safely parse JSON
    const data = await res.json();

    let errorMsg: string | undefined;
    if (!res.ok || data.success === false) {
      const serverMessage =
        typeof data.message === 'string' && data.message.trim().length > 0
          ? data.message.trim()
          : typeof data.error === 'string' && data.error.trim().length > 0
          ? data.error.trim()
          : undefined;

      if (res.status === 401) {
        if (endpoint.includes('/auth/me')) {
          localStorage.removeItem('setu_auth_token');
          errorMsg = serverMessage || 'Your authentication session has expired. Please sign in again.';
        } else if (endpoint.includes('/auth/login')) {
          errorMsg = serverMessage || 'Invalid email or password. Please try again.';
        } else {
          errorMsg = serverMessage || 'Your authentication session has expired. Please sign in again.';
        }
      } else if (res.status === 409) {
        errorMsg = serverMessage || 'An account with this email already exists.';
      } else if (res.status === 503) {
        errorMsg =
          serverMessage ||
          'The backend service or database is temporarily unavailable. Please try again shortly.';
      } else if (
        res.status === 400 &&
        Array.isArray(data.errors) &&
        data.errors.length > 0
      ) {
        errorMsg =
          data.errors[0].message ||
          serverMessage ||
          'Request validation failed. Please check your inputs.';
      } else if (serverMessage) {
        errorMsg = serverMessage;
      } else {
        errorMsg = endpoint.includes('register')
          ? 'Registration was unsuccessful. Please try again.'
          : 'Request failed. Please try again.';
      }
    }

    return {
      ok: res.ok && data.success !== false,
      status: res.status,
      data,
      error: errorMsg
    };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      error: isAbort
        ? 'The server is taking longer than usual to respond (cold start). Please try again.'
        : typeof navigator !== 'undefined' && navigator.onLine === false
        ? 'Network connection failed. Please check your internet connection and try again.'
        : 'Unable to reach the SETU backend server. Please ensure the server is running or try again shortly.'
    };
  }
};
