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

  // Attach stored JWT Bearer token if present (vital for cross-origin Netlify <-> Render requests)
  const token = localStorage.getItem('setu_auth_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Required for cross-origin cookies
    });

    const contentType = res.headers.get('content-type') || '';

    // Guard against non-JSON responses (e.g. Netlify index.html fallback, 404 text/plain, 502 Bad Gateway)
    if (!contentType.includes('application/json')) {
      let friendlyMessage = 'Unable to connect to the server. Please try again.';
      if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
        friendlyMessage = 'Unable to connect to the server. Please try again.';
      } else if (res.status === 500) {
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
      if (res.status === 409 || (data.message && data.message.toLowerCase().includes('already exists'))) {
        errorMsg = 'An account with this email already exists.';
      } else if (res.status === 401) {
        if (endpoint.includes('/me')) {
          localStorage.removeItem('setu_auth_token');
          errorMsg = 'Session expired. Please log in again.';
        } else {
          errorMsg = 'Invalid email or password. Please try again.';
        }
      } else if (res.status === 400 && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg = data.errors[0].message || data.message || 'Registration was unsuccessful. Please check your inputs.';
      } else if (data.message && !data.success) {
        errorMsg = data.message;
      } else {
        errorMsg = data.error || (endpoint.includes('register') ? 'Registration was unsuccessful. Please try again.' : 'Request failed. Please try again.');
      }
    }

    return {
      ok: res.ok && data.success !== false,
      status: res.status,
      data,
      error: errorMsg
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Unable to connect to the server. Please try again.'
    };
  }
};
