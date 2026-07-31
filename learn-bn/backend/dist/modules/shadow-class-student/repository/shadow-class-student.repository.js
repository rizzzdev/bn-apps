import { prisma } from '../../../database';
export class ClassStudentRepository {
    async findAll(skip, take) {
        return prisma.classStudent.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.classStudent.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.classStudent.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const classStudentRepository = new ClassStudentRepository();
