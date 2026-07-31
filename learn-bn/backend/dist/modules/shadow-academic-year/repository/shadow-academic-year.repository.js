import { prisma } from '../../../database';
export class AcademicYearRepository {
    async findAll(skip, take) {
        return prisma.academicYear.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.academicYear.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.academicYear.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const academicYearRepository = new AcademicYearRepository();
