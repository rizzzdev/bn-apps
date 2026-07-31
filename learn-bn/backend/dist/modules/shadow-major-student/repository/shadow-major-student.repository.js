import { prisma } from '../../../database';
export class MajorStudentRepository {
    async findAll(skip, take) {
        return prisma.majorStudent.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.majorStudent.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.majorStudent.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const majorStudentRepository = new MajorStudentRepository();
