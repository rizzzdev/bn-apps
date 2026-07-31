import { prisma } from '../../../database';
export class SubjectTeacherRepository {
    async findAll(skip, take) {
        return prisma.subjectTeacher.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.subjectTeacher.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.subjectTeacher.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const subjectTeacherRepository = new SubjectTeacherRepository();
