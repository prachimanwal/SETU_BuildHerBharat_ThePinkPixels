// Centralized API Client for SETU Frontend

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any; error?: string }> => {
  const url = getApiUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  // Attach stored JWT Bearer token if present (fallback for cross-origin Netlify <-> Render requests)
  const token = localStorage.getItem('setu_auth_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Required for HttpOnly cookies
    });

    const contentType = res.headers.get('content-type') || '';

    // Guard against non-JSON responses (e.g. Netlify index.html fallback, 502/503 Render cold-start or outage)
    if (!contentType.includes('application/json')) {
      let friendlyMessage = 'Backend server is currently unavailable. Please try again in a moment.';
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
        } else if (endpoint.includes('/auth/google')) {
          errorMsg = serverMessage || 'Invalid Google credential. Please try signing in again.';
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
          'The authentication service or database is temporarily unavailable. Please try again shortly.';
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
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error:
        typeof navigator !== 'undefined' && navigator.onLine === false
          ? 'Network connection failed. Please check your internet connection and try again.'
          : 'Unable to reach the SETU backend server. Please check your connection or try again shortly.'
    };
  }
};
