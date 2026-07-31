import { PUBLIC_MASTER_API_URL, PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';

const MASTER_URL = PUBLIC_MASTER_API_URL;

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

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, options: RequestInit = {}, isFormData = false): Promise<T> {
  const token = getCookie('access_token');
  const baseUrl = browser ? '/api/v1' : PUBLIC_API_URL;

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

    const refreshRes = await fetch(`${MASTER_URL}/auth/refresh`, {
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
    if (browser) {
      window.location.href = '/login';
    }
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
