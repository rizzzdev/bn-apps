import { prisma } from '../../../database';
export class StudentRepository {
    async findAll(skip, take) {
        return prisma.student.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.student.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        if (data.userId) {
            const existingByUserId = await prisma.student.findFirst({
                where: { userId: data.userId },
            });
            if (existingByUserId && existingByUserId.id !== id) {
                await prisma.student.delete({ where: { id: existingByUserId.id } });
            }
        }
        return prisma.student.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const studentRepository = new StudentRepository();
