import { prisma } from '@auth/database/index.js';
import { sentriAuth } from '@auth/index.js';
import type { IAuthDataRepository, Role, AuthUser, AuthUserIdentifier } from '@app/ports/auth-data.port.js';

export class AuthDataService implements IAuthDataRepository {
  async register(data: {
    identifiers: Array<{ type: string; value: string }>;
    password: string;
    roles: Role[];
  }): Promise<{ userId: string }> {
    const res = await sentriAuth.register(data);
    if (!res.success) {
      throw new Error(JSON.stringify(res.error));
    }
    return { userId: res.user.id };
  }

  async bulkRegister(data: Array<{
    identifiers: Array<{ type: string; value: string }>;
    password: string;
    roles: Role[];
  }>): Promise<Array<{ userId: string; email: string }>> {
    const results: Array<{ userId: string; email: string }> = [];

    for (const item of data) {
      try {
        const emailIdent = item.identifiers.find((i) => i.type === "email");
        const result = await sentriAuth.register(item);
        if (result.success) {
          results.push({ userId: result.user.id, email: emailIdent?.value || "" });
        }
      } catch (e) {
        console.warn("[AuthDataService] Skipping existing user:", item.identifiers[0]?.value);
      }
    }

    return results;
  }

  async updateIdentifiers(userId: string, identifiers: Array<{ type: string; value: string }>): Promise<void> {
    if (sentriAuth.bulkUpdateIdentifiers) {
      await sentriAuth.bulkUpdateIdentifiers(userId, identifiers);
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await sentriAuth.hashPassword(newPassword);
    await prisma.sentri_users.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await prisma.sentri_users.delete({ where: { id: userId } }).catch((e) => console.warn('[AuthDataService] Cleanup error:', e));
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    if (userIds.length > 0) {
      await prisma.sentri_users.deleteMany({ where: { id: { in: userIds } } }).catch((e) => console.warn('[AuthDataService] Cleanup error:', e));
    }
  }

  async findUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.sentri_users.findUnique({
      where: { id: userId },
      include: { sentri_identifiers: true },
    });
    if (!user) return null;

    let roles: Role[] = [];
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
    } catch (e) {
      roles = [];
    }

    return {
      id: user.id,
      roles: Array.isArray(roles) ? roles : [],
      identifiers: user.sentri_identifiers.map(i => ({
        id: i.id,
        userId: i.user_id,
        type: i.type,
        value: i.value,
      })),
      createdAt: user.created_at,
    };
  }

  async findUsersByIds(userIds: string[]): Promise<AuthUser[]> {
    if (!userIds || userIds.length === 0) return [];
    const users = await prisma.sentri_users.findMany({
      where: { id: { in: userIds } },
      include: { sentri_identifiers: true },
    });

    return users.map(user => {
      let roles: Role[] = [];
      try {
        roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
      } catch (e) {
        roles = [];
      }
      return {
        id: user.id,
        roles: Array.isArray(roles) ? roles : [],
        identifiers: user.sentri_identifiers.map(i => ({
          id: i.id,
          userId: i.user_id,
          type: i.type,
          value: i.value,
        })),
        createdAt: user.created_at,
      };
    });
  }

  async getUserIdentifiers(userId: string): Promise<AuthUserIdentifier[]> {
    const idents = await prisma.sentri_identifiers.findMany({
      where: { user_id: userId },
    });
    return idents.map(i => ({
      id: i.id,
      userId: i.user_id,
      type: i.type,
      value: i.value,
    }));
  }
}

export const authDataService = new AuthDataService();
