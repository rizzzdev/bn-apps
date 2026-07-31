import { prisma } from '../../../database';
export class TeacherRepository {
    async findAll(skip, take) {
        return prisma.teacher.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.teacher.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        if (data.userId) {
            const existingByUserId = await prisma.teacher.findFirst({
                where: { userId: data.userId },
            });
            if (existingByUserId && existingByUserId.id !== id) {
                await prisma.teacher.delete({ where: { id: existingByUserId.id } });
            }
        }
        return prisma.teacher.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const teacherRepository = new TeacherRepository();
