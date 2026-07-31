import { prisma } from '@internship/database/index.js';
import { CreateIndustryMentorDto, UpdateIndustryMentorDto } from '@internship/modules/industry-mentor/domain/index.js';
import { Prisma } from '@internship/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';

export class IndustryMentorRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.IndustryMentorWhereInput) {
    const where: Prisma.IndustryMentorWhereInput = { ...whereClause, deletedAt: null };
    return prisma.industryMentor.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { company: true } });
  }

  async count(whereClause?: Prisma.IndustryMentorWhereInput) {
    const where: Prisma.IndustryMentorWhereInput = { ...whereClause, deletedAt: null };
    return prisma.industryMentor.count({ where });
  }

  async findById(id: string) {
    return prisma.industryMentor.findFirst({ where: { id, deletedAt: null } });
  }

  async create(data: CreateIndustryMentorDto) {
    const created = await prisma.$transaction(async (tx) => {
      const { email, password, ...restData } = data;

      const { userId } = await getOrchestrator().masterAuth.register({
        identifiers: [{ type: "email", value: email }],
        password: password,
        roles: ["industry_mentor"],
      });

      const mentor = await tx.industryMentor.create({
        data: {
          ...restData,
          email,
          userId: userId,
        },
      });

      return mentor;
    });

    return created;
  }

  async update(id: string, data: UpdateIndustryMentorDto) {
    const { password, companyId, email, ...rest } = data;
    const updateData: Prisma.IndustryMentorUpdateInput = { ...rest as Prisma.IndustryMentorUpdateInput };

    if (companyId !== undefined) {
      if (companyId === null) {
        updateData.company = { disconnect: true };
      } else {
        updateData.company = { connect: { id: companyId } };
      }
    }

    const existingMentor = await prisma.industryMentor.findUnique({ where: { id } });
    const updatedMentor = await prisma.industryMentor.update({ where: { id }, data: updateData });

    // Update auth identifiers if email changed
    const emailChanged = email !== undefined && email !== existingMentor?.email;
    if (emailChanged && updatedMentor.userId) {
      const currentEmail = email !== undefined ? email : existingMentor?.email;
      const identifiers: Array<{ type: string; value: string }> = [];
      if (currentEmail) identifiers.push({ type: "email", value: currentEmail });
      if (identifiers.length > 0) {
        await getOrchestrator().masterAuth.updateIdentifiers(updatedMentor.userId, identifiers);
      }
    }

    // Update password if provided
    if (password && updatedMentor.userId) {
      await getOrchestrator().masterAuth.changePassword(updatedMentor.userId, password);
    }

    return updatedMentor;
  }

  async softDelete(id: string) {
    const mentor = await prisma.industryMentor.findUnique({ where: { id } });
    if (mentor?.userId) {
      await getOrchestrator().masterAuth.deleteUser(mentor.userId);
    }
    return prisma.industryMentor.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async bulkSoftDelete(ids: string[]) {
    const mentors = await prisma.industryMentor.findMany({ where: { id: { in: ids } } });
    const userIds = mentors.map((m) => m.userId).filter(Boolean) as string[];

    if (userIds.length > 0) {
      await getOrchestrator().masterAuth.bulkDeleteUsers(userIds);
    }

    return prisma.industryMentor.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  async bulkUpdateCompany(ids: string[], companyId: string | null) {
    return prisma.industryMentor.updateMany({
      where: { id: { in: ids } },
      data: { companyId },
    });
  }

  async changePassword(userId: string, newPassword: string) {
    await getOrchestrator().masterAuth.changePassword(userId, newPassword);
    return true;
  }
}

export const industryMentorRepository = new IndustryMentorRepository();
