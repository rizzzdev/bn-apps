import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
import { browser } from '$app/environment';

const getAuthApiUrl = (): string => {
  const raw = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const match = raw.match(/^(https?:\/\/[^/]+(?:\/api\/v1)?)/i);
  if (match) {
    const base = match[1].replace(/\/+$/, '');
    return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  }
  return 'http://localhost:3000/api/v1';
};

const PORTAL_URL = PUBLIC_PORTAL_URL || 'http://localhost:5173';

function getCookie(name: string): string | null {
  if (!browser) return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearAllCookies() {
  if (!browser) return;
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
}

function redirectToPortal() {
  if (!browser) return;
  const loginUrl = PORTAL_URL.endsWith('/login') ? PORTAL_URL : `${PORTAL_URL.replace(/\/+$/, '')}/login`;
  window.location.href = loginUrl;
}

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, options: RequestInit = {}, isFormData = false): Promise<T> {
  const token = getCookie('access_token');
  const baseUrl = PUBLIC_API_URL;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const res = await fetch(`${baseUrl}${path}`, config);

  if (res.status === 401) {
    if (!browser) {
      throw new ApiError('Unauthorized', 401);
    }

    const refreshRes = await fetch(`${getAuthApiUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const newToken = getCookie('access_token');
      const retryHeaders: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };
      if (!isFormData && !retryHeaders['Content-Type']) {
        retryHeaders['Content-Type'] = 'application/json';
      }
      if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;

      const retryRes = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });

      const retryBody = await retryRes.json();
      if (!retryRes.ok) {
        throw new ApiError(retryBody.message || 'Request failed', retryRes.status);
      }
      return retryBody as T;
    }

    clearAllCookies();
    redirectToPortal();
    throw new Error('SESSION_EXPIRED');
  }

  const body = await res.json();

  if (!res.ok) {
    throw new ApiError(body.message || 'Request failed', res.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, data?: unknown, isFormData = false) => {
    const options: RequestInit = { method: 'POST' };
    if (isFormData) {
      options.body = data as FormData;
    } else {
      options.body = data ? JSON.stringify(data) : undefined;
    }
    return request<T>(path, options, isFormData);
  },

  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
