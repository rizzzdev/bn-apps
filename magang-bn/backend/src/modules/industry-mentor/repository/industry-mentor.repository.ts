import { prisma } from '@/database/index.js';
import { CreateIndustryMentorDto, UpdateIndustryMentorDto } from '@/modules/industry-mentor/domain/index.js';
import { Prisma } from '@/database/generated/client/index.js';
import { env } from '@/configs/env.js';
import { BadRequestError } from '@/errors/index.js';

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

      
      const {email, password, ...restData} = data

      const authResponse = await fetch(env.MASTER_API_URL + "/auth/register", {
        method: "POST",
        headers: {
          "X-Api-Key": env.MASTER_API_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          identifiers: [
            { type: "email", value: email },
            ...(restData.phone ? [{ type: "phone", value: restData.phone }] : [])
          ],
          password: password,
          roles: ["industry_mentor"],
        })
      })

      
      const auth = await authResponse.json();
      console.log({auth})
      if(auth.error) {
        throw new BadRequestError(auth.message)
      }

      const mentor = await tx.industryMentor.create({ data: {
        ...restData,
        email,
        userId: auth.data.user.id!
      } });


      return mentor

    })

    return created
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
    
    // Get existing to construct full identifiers if needed
    const existingMentor = await prisma.industryMentor.findUnique({ where: { id } });
    const updatedMentor = await prisma.industryMentor.update({ where: { id }, data: updateData });

    const emailChanged = email !== undefined && email !== existingMentor?.email;
    const phoneChanged = rest.phone !== undefined && rest.phone !== existingMentor?.phone;

    if ((emailChanged || phoneChanged) && updatedMentor.userId) {
      const currentEmail = email !== undefined ? email : existingMentor?.email;
      const currentPhone = rest.phone !== undefined ? rest.phone : existingMentor?.phone;
      
      const identifiers = [];
      if (currentEmail) identifiers.push({ type: "email", value: currentEmail });
      if (currentPhone) identifiers.push({ type: "phone", value: currentPhone });

      const authResponse = await fetch(`${env.MASTER_API_URL}/auth/users/${updatedMentor.userId}/identifiers`, {
        method: "PATCH",
        headers: {
          "X-Api-Key": env.MASTER_API_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(identifiers)
      });

      let auth: Record<string, unknown>;
      try {
        const text = await authResponse.text();
        auth = JSON.parse(text);
      } catch (e) {
        throw new BadRequestError("Gagal mengupdate kredensial di Master API (Response bukan JSON). Status: " + authResponse.status);
      }

      if (!authResponse.ok || auth.error) {
        throw new BadRequestError((auth.message as string) || "Gagal mengupdate kredensial di Master API");
      }
    }

    if (password && updatedMentor.userId) {
      const authResponse = await fetch(`${env.MASTER_API_URL}/auth/users/${updatedMentor.userId}/password`, {
        method: "PATCH",
        headers: {
          "X-Api-Key": env.MASTER_API_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newPassword: password })
      });

      let auth: Record<string, unknown>;
      try {
        const text = await authResponse.text();
        auth = JSON.parse(text);
      } catch (e) {
        throw new BadRequestError("Gagal mengubah password di Master API (Response bukan JSON). Status: " + authResponse.status);
      }

      if (!authResponse.ok || auth.error) {
        throw new BadRequestError((auth.message as string) || "Gagal mengubah password di Master API");
      }
    }

    return updatedMentor;
  }

  async softDelete(id: string) {
    const mentor = await prisma.industryMentor.findUnique({ where: { id } });
    if (mentor?.userId) {
      await fetch(`${env.MASTER_API_URL}/auth/users/${mentor.userId}`, {
        method: "DELETE",
        headers: { "X-Api-Key": env.MASTER_API_KEY! }
      }).catch(console.error);
    }
    return prisma.industryMentor.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  
  async bulkSoftDelete(ids: string[]) {
    const mentors = await prisma.industryMentor.findMany({ where: { id: { in: ids } } });
    const userIds = mentors.map(m => m.userId).filter(Boolean) as string[];

    for (const userId of userIds) {
      await fetch(`${env.MASTER_API_URL}/auth/users/${userId}`, {
        method: "DELETE",
        headers: { "X-Api-Key": env.MASTER_API_KEY! }
      }).catch(console.error);
    }

    return prisma.industryMentor.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }

  async bulkUpdateCompany(ids: string[], companyId: string | null) {
    return prisma.industryMentor.updateMany({
      where: { id: { in: ids } },
      data: { companyId }
    });
  }

  async changePassword(userId: string, newPassword: string) {
    const authResponse = await fetch(`${env.MASTER_API_URL}/auth/users/${userId}/password`, {
      method: "PATCH",
      headers: {
        "X-Api-Key": env.MASTER_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ newPassword })
    });

    const auth = await authResponse.json();
    if (!authResponse.ok || auth.error) {
      throw new BadRequestError(auth.message || "Gagal mengubah password");
    }

    return true;
  }
}

export const industryMentorRepository = new IndustryMentorRepository();
