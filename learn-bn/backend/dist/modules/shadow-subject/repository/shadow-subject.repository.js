import { prisma } from '../../../database';
export class SubjectRepository {
    async findAll(skip, take) {
        return prisma.subject.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.subject.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.subject.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const subjectRepository = new SubjectRepository();
