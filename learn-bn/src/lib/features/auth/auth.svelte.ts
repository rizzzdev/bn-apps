import { env as publicEnv } from '$env/dynamic/public';
import { browser } from '$app/environment';

export type UserRole = 'teacher' | 'student' | 'super_admin' | null;

export type User = {
  id: string;
  name: string;
  role: UserRole;
  roles: string[];
  profileId: string | null;
  [key: string]: unknown;
};

export const getPortalLoginUrl = (): string => {
  const raw = ((publicEnv as Record<string, string | undefined>).PUBLIC_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return raw.endsWith('/login') ? raw : `${raw}/login`;
};

const getCookieDomain = (): string => {
  const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
  if (!raw) return '';
  return raw.startsWith('.') ? raw : `.${raw}`;
};

function getIdentifier(data: any): string {
  if (data.identifier) return data.identifier;
  if (data.identifiers?.length) return data.identifiers[0].value;
  return '';
}

function resolveRole(roles?: string[]): UserRole {
  if (!roles?.length) return null;
  if (roles.includes('student')) return 'student';
  if (roles.includes('teacher')) return 'teacher';
  if (roles.includes('super_admin')) return 'super_admin';
  return null;
}

export function getHomePath(role: UserRole): string {
  if (role === 'student') return '/student';
  return '/teacher';
}

export function mapUser(data: any): User | null {
  if (!data || !data.id) return null;
  return {
    ...data,
    id: data.id,
    name: data.name || getIdentifier(data) || '',
    role: resolveRole(data.roles),
    roles: data.roles || [],
    profileId: data.profileId ?? null,
  };
}

class AuthState {
  user = $state<User | null>(null);
  loading = $state(true);

  initUser(data: any) {
    this.user = mapUser(data);
    this.loading = false;
  }

  async logout() {
    const rawApiUrl = ((publicEnv as Record<string, string | undefined>).PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const match = rawApiUrl.match(/^(https?:\/\/[^/]+(?:\/api\/v1)?)/i);
    const baseUrl = match ? match[1].replace(/\/+$/, '') : 'http://localhost:3000/api/v1';
    const authUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

    try {
      await fetch(`${authUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // tetapkan pembersihan meskipun request backend error
    }

    if (browser) {
      const base = `path=/; ${getCookieDomain() ? `domain=${getCookieDomain()};` : ''}`;
      document.cookie = `access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${base}`;
      document.cookie = `refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${base}`;
      document.cookie = `sentri-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${base}`;
      window.location.href = getPortalLoginUrl();
    }
    this.user = null;
  }
}

export const authState = new AuthState();
