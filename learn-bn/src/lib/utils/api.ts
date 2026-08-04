import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
import { browser } from '$app/environment';

export function getApiBaseUrl(): string {
  let raw = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  if (raw.endsWith('/learn')) {
    raw = raw.slice(0, -6).replace(/\/+$/, '');
  }
  return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
}

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

export async function apiClient(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getCookie('access_token');
  const apiBase = getApiBaseUrl();

  let fullPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (
    !fullPath.startsWith('/learn') &&
    !fullPath.startsWith('/master') &&
    !fullPath.startsWith('/academic') &&
    !fullPath.startsWith('/auth')
  ) {
    fullPath = `/learn${fullPath}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;
  if (isFormData) delete headers['Content-Type'];

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(`${apiBase}${fullPath}`, config);

    if (response.status === 401) {
      const refreshRes = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const newToken = getCookie('access_token');
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        };
        if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
        if (isFormData) delete retryHeaders['Content-Type'];

        return fetch(`${apiBase}${fullPath}`, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        });
      }

      clearAllCookies();
      redirectToPortal();
      throw new Error('SESSION_EXPIRED');
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
    throw error;
  }
}
