import { prisma } from '@/database/index.js';
import { CreateInternshipPlacementDto, UpdateInternshipPlacementDto } from '@/modules/internship-placement/domain/index.js';
import { Prisma } from '@/database/generated/client/index.js';

export class InternshipPlacementRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.InternshipPlacementWhereInput) {
    const where: Prisma.InternshipPlacementWhereInput = { ...whereClause, deletedAt: null };
    return prisma.internshipPlacement.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        company: true,
        teacher: true,
        industryMentor: true,
        assessments: {
          include: {
            attachment: true
          }
        }
      }
    });
  }

  async count(whereClause?: Prisma.InternshipPlacementWhereInput) {
    const where: Prisma.InternshipPlacementWhereInput = { ...whereClause, deletedAt: null };
    return prisma.internshipPlacement.count({ where });
  }

  async findById(id: string) {
    return prisma.internshipPlacement.findFirst({ 
      where: { id, deletedAt: null },
      include: {
        student: true,
        company: true,
        teacher: true,
        industryMentor: true,
        assessments: {
          include: {
            attachment: true
          }
        }
      }
    });
  }

  async getActivePlacementsCount(companyId: string, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return db.internshipPlacement.count({
      where: {
        companyId,
        status: 'active',
        deletedAt: null
      }
    });
  }

  async create(data: CreateInternshipPlacementDto & { endDate: Date }) {
    return prisma.internshipPlacement.create({ data: data as Prisma.InternshipPlacementUncheckedCreateInput });
  }

  async bulkCreate(data: (CreateInternshipPlacementDto & { endDate: Date })[], tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    await db.internshipPlacement.createMany({
      data: data as Prisma.InternshipPlacementCreateManyInput[],
    });
    
    // Ambil kembali data yang baru dibuat beserta relasi student-nya
    const studentIds = data.map(d => d.studentId);
    return db.internshipPlacement.findMany({
      where: { studentId: { in: studentIds } },
      include: { student: true }
    });
  }

  async update(id: string, data: UpdateInternshipPlacementDto) {
    return prisma.internshipPlacement.update({ where: { id }, data: data as Prisma.InternshipPlacementUpdateInput });
  }

  async softDelete(id: string) {
    return prisma.internshipPlacement.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  async bulkSoftDelete(ids: string[]) {
    return prisma.internshipPlacement.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }
  async bulkUpdateStatus(ids: string[], status: Prisma.InternshipPlacementUpdateInput['status']) {
    return prisma.internshipPlacement.updateMany({ where: { id: { in: ids } }, data: { status } });
  }
  async bulkUpdateAssessable(ids: string[], isAssessable: boolean) {
    return prisma.internshipPlacement.updateMany({ where: { id: { in: ids } }, data: { isAssessable } });
  }
}

export const internshipPlacementRepository = new InternshipPlacementRepository();
