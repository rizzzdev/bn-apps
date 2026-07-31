import { prisma } from '@auth/database/index.js';

export class UserRepository {
  async findAll(skip: number, take: number, search?: string) {
    const where = search ? {
      sentri_identifiers: {
        some: {
          type: 'email',
          value: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      }
    } : {};

    return prisma.sentri_users.findMany({
      skip,
      take,
      where,
      include: {
        sentri_identifiers: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async count(search?: string) {
    const where = search ? {
      sentri_identifiers: {
        some: {
          type: 'email',
          value: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      }
    } : {};

    return prisma.sentri_users.count({ where });
  }

  async findById(id: string) {
    return prisma.sentri_users.findFirst({
      where: { id },
      include: {
        sentri_identifiers: true
      }
    });
  }

  async updateRoles(id: string, roles: string) {
    return prisma.sentri_users.update({
      where: { id },
      data: { roles },
      include: {
        sentri_identifiers: true
      }
    });
  }
}

export const userRepository = new UserRepository();
