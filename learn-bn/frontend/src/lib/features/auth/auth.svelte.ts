import { PUBLIC_MASTER_API_URL } from '$env/static/public';

export type UserRole = 'teacher' | 'student' | 'super_admin' | null;

export type User = {
  id: string;
  name: string;
  role: UserRole;
  profileId: string | null;
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

function mapUser(data: any): User {
  return {
    id: data.id,
    name: data.name || getIdentifier(data) || '',
    role: resolveRole(data.roles),
    profileId: data.profileId ?? null,
  };
}

class AuthState {
  user = $state<User | null>(null);
  loading = $state(true);

  async checkSession() {
    this.loading = true;
    try {
      const res = await fetch(`${PUBLIC_MASTER_API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) {
        this.user = null;
        return;
      }
      const body = await res.json();
      if (body.data) {
        this.user = mapUser(body.data);
      } else {
        this.user = null;
      }
    } catch {
      this.user = null;
    } finally {
      this.loading = false;
    }
  }

  async login(identifier: string, password: string): Promise<User> {
    const res = await fetch(`${PUBLIC_MASTER_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
      credentials: 'include',
    });

    const body = await res.json();

    if (!body.data || !body.data.user) {
      throw new Error(body.message || 'Login gagal');
    }

    const user = mapUser({ ...body.data.user, identifier });
    this.user = user;
    return user;
  }

  async logout() {
    try {
      await fetch(`${PUBLIC_MASTER_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // tetap bersihkan state meskipun request gagal
    }
    this.user = null;
  }
}

export const authState = new AuthState();
