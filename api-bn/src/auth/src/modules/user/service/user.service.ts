import { userRepository } from '../repository/user.repository.js';
import { UpdateRoleDto, BulkUpdateRoleDto } from '../domain/index.js';
import { prisma as masterPrisma } from '#master/database/index.js';
import { prisma as internshipPrisma } from '#internship/database/index.js';
import { BadRequestError, NotFoundError } from '#app';

export class UserService {
  private formatUser(user: any) {
    if (!user) return null;
    const emailIdentifier = user.sentri_identifiers?.find((i: any) => i.type === 'email');
    
    let roles = [];
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
    } catch (e) {
      roles = [];
    }

    return {
      id: user.id,
      email: emailIdentifier ? emailIdentifier.value : null,
      roles: Array.isArray(roles) ? roles : [],
      status: 'Active',
      createdAt: user.created_at
    };
  }

  private async validateRolesForUser(user: any, newRoles: string[]) {
    if (!user) return;
    const userId = user.id;
    const emailIdentifier = user.sentri_identifiers?.find((i: any) => i.type === 'email');
    const userEmail = emailIdentifier ? emailIdentifier.value : null;

    if (newRoles.includes('student')) {
      const student = await masterPrisma.student.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { userId: userId },
            ...(userEmail ? [{ email: userEmail }] : [])
          ]
        }
      });
      if (!student) {
        throw new BadRequestError(`Pengguna (${userEmail || userId}) belum terdaftar sebagai data Student`);
      }
    }

    if (newRoles.includes('teacher')) {
      const teacher = await masterPrisma.teacher.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { userId: userId },
            ...(userEmail ? [{ email: userEmail }] : [])
          ]
        }
      });
      if (!teacher) {
        throw new BadRequestError(`Pengguna (${userEmail || userId}) belum terdaftar sebagai data Teacher`);
      }
    }

    if (newRoles.includes('industry_mentor')) {
      const mentor = await internshipPrisma.industryMentor.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { userId: userId },
            ...(userEmail ? [{ email: userEmail }] : [])
          ]
        }
      });
      if (!mentor) {
        throw new BadRequestError(`Pengguna (${userEmail || userId}) belum terdaftar sebagai data Industry Mentor`);
      }
    }
  }

  async getAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      userRepository.findAll(skip, limit, search),
      userRepository.count(search)
    ]);
    
    return {
      data: users.map(u => this.formatUser(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.formatUser(user);
  }

  async updateRoles(id: string, data: UpdateRoleDto) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.validateRolesForUser(user, data.roles);

    const updated = await userRepository.updateRoles(id, JSON.stringify(data.roles));
    return this.formatUser(updated);
  }

  async bulkUpdateRoles(data: BulkUpdateRoleDto) {
    for (const id of data.userIds) {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundError(`User ${id} not found`);
      }
      await this.validateRolesForUser(user, data.roles);
    }

    const promises = data.userIds.map(id => 
      userRepository.updateRoles(id, JSON.stringify(data.roles))
    );
    await Promise.all(promises);
    return { success: true, count: data.userIds.length };
  }
}

export const userService = new UserService();
