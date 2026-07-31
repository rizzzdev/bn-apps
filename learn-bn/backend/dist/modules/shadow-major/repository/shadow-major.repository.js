import { prisma } from '../../../database';
export class MajorRepository {
    async findAll(skip, take) {
        return prisma.major.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.major.findUnique({ where: { id } });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.major.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const majorRepository = new MajorRepository();
