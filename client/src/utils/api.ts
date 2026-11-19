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

    // Guard against HTML error pages (e.g. Netlify index.html fallback)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE');

      let fallbackMessage = 'Server returned an invalid response format.';
      if (isHtml) {
        fallbackMessage =
          'Received HTML instead of JSON. The backend server URL is not configured or currently unreachable on Netlify. Please configure VITE_API_URL or Netlify API proxy.';
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: fallbackMessage
      };
    }

    // Safely parse JSON
    const data = await res.json();
    const errorMsg =
      data.message && !data.success
        ? data.message
        : data.error || (res.ok ? undefined : 'Request failed');

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
      error: err.message || 'Network connection failed'
    };
  }
};
