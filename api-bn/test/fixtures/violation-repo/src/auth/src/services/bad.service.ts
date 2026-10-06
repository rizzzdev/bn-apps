// Fixture ini SENGAJA meniru bug lama: auth query langsung ke Prisma client
// module master, alih-alih lewat #app/ports + Orchestrator.
import { prisma as masterPrisma } from '#master/database/index.js';

export const findStudent = () => masterPrisma.student.findFirst();
