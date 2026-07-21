import { prisma } from '@/database/index.js';
import { CreateCompanyDto, UpdateCompanyDto } from '@/modules/company/domain/index.js';
import { Prisma } from '@/database/generated/client/index.js';

export class CompanyRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.CompanyWhereInput) {
    const where: Prisma.CompanyWhereInput = { ...whereClause, deletedAt: null };
    return prisma.company.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            internshipPlacements: {
              where: { status: 'active', deletedAt: null }
            }
          }
        }
      }
    });
  }

  async count(whereClause?: Prisma.CompanyWhereInput) {
    const where: Prisma.CompanyWhereInput = { ...whereClause, deletedAt: null };
    return prisma.company.count({ where });
  }

  async findById(id: string) {
    return prisma.company.findFirst({ where: { id, deletedAt: null } });
  }

  async create(data: CreateCompanyDto) {
    return prisma.company.create({ data: data as Prisma.CompanyCreateInput });
  }

  async update(id: string, data: UpdateCompanyDto) {
    return prisma.company.update({ where: { id }, data: data as Prisma.CompanyUpdateInput });
  }

  async softDelete(id: string) {
    return prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  async bulkSoftDelete(ids: string[]) {
    return prisma.company.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }
}

export const companyRepository = new CompanyRepository();
