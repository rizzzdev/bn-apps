import { prisma } from '../../../database';
export class MaterialRepository {
    async create(data, teacherId) {
        const targetClassIds = data.classIds && data.classIds.length > 0 ? data.classIds : data.classId ? [data.classId] : [];
        return prisma.material.create({
            data: {
                title: data.title,
                content: data.content,
                status: data.status || 'Draft',
                teacherId,
                attachments: {
                    create: data.attachments || [],
                },
                classes: {
                    create: targetClassIds.map((classId) => ({ classId })),
                },
            },
            include: {
                attachments: true,
                classes: {
                    include: { class: { select: { id: true, name: true } } },
                },
            },
        });
    }
    async findAllByClass(classId, isStudent = false, studentId) {
        const materials = await prisma.material.findMany({
            where: {
                classes: {
                    some: { classId },
                },
                deletedAt: null,
                ...(isStudent && { status: 'Published' }),
            },
            include: {
                attachments: true,
                classes: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                _count: { select: { classStudents: { where: { status: 'Aktif', deletedAt: null } } } },
                            },
                        },
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        fullname: true,
                        prefixTitle: true,
                        suffixTitle: true,
                        pictureUrl: true,
                        subjectTeachers: {
                            include: {
                                subject: { select: { id: true, name: true, code: true } },
                            },
                        },
                    },
                },
                _count: { select: { reads: true } },
                ...(studentId ? {
                    reads: {
                        where: { studentId },
                        select: { readAt: true },
                    },
                } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
        return materials.map((m) => {
            const readCount = m._count?.reads ?? 0;
            const totalStudents = m.classes?.reduce((sum, c) => sum + (c.class?._count?.classStudents ?? 0), 0) ?? 0;
            const readStats = { readCount, totalStudents };
            if (studentId) {
                const readRecord = m.reads?.[0];
                return {
                    ...m,
                    readStats,
                    isRead: !!readRecord,
                    readAt: readRecord?.readAt || null,
                };
            }
            return {
                ...m,
                readStats,
            };
        });
    }
    async findById(id, studentId) {
        const material = await prisma.material.findFirst({
            where: { id, deletedAt: null },
            include: {
                attachments: true,
                classes: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                _count: { select: { classStudents: { where: { status: 'Aktif', deletedAt: null } } } },
                            },
                        },
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        fullname: true,
                        prefixTitle: true,
                        suffixTitle: true,
                        pictureUrl: true,
                        subjectTeachers: {
                            include: {
                                subject: { select: { id: true, name: true, code: true } },
                            },
                        },
                    },
                },
                _count: { select: { reads: true } },
                ...(studentId ? {
                    reads: {
                        where: { studentId },
                        select: { readAt: true },
                    },
                } : {
                    reads: {
                        select: {
                            id: true,
                            readAt: true,
                            student: {
                                select: {
                                    id: true,
                                    fullname: true,
                                    nis: true,
                                    pictureUrl: true,
                                },
                            },
                        },
                        orderBy: { readAt: 'desc' },
                    },
                }),
            },
        });
        if (!material)
            return null;
        const m = material;
        const readCount = m._count?.reads ?? 0;
        const totalStudents = m.classes?.reduce((sum, c) => sum + (c.class?._count?.classStudents ?? 0), 0) ?? 0;
        const readStats = { readCount, totalStudents };
        if (studentId) {
            const readRecord = m.reads?.[0];
            return {
                ...material,
                readStats,
                isRead: !!readRecord,
                readAt: readRecord?.readAt || null,
            };
        }
        if (!studentId && material.classes && material.classes.length > 0) {
            const classIds = m.classes.map((c) => c.classId || c.class?.id).filter(Boolean);
            const classStudents = await prisma.classStudent.findMany({
                where: { classId: { in: classIds }, status: 'Aktif', deletedAt: null },
                include: {
                    class: { select: { id: true, name: true } },
                    student: { select: { id: true, fullname: true, nis: true, pictureUrl: true } },
                },
                orderBy: [{ class: { name: 'asc' } }, { student: { fullname: 'asc' } }],
            });
            const readMap = new Map((m.reads || []).map((r) => [r.student?.id || r.studentId, r]));
            const readers = classStudents.map((cs) => {
                const readRecord = readMap.get(cs.student.id);
                return {
                    student: cs.student,
                    class: cs.class,
                    isRead: !!readRecord,
                    readAt: readRecord?.readAt || null,
                };
            });
            return {
                ...material,
                readStats,
                readers,
            };
        }
        return {
            ...material,
            readStats,
        };
    }
    async markAsRead(materialId, studentId) {
        return prisma.materialRead.upsert({
            where: {
                materialId_studentId: { materialId, studentId },
            },
            create: { materialId, studentId },
            update: { readAt: new Date() },
        });
    }
    async update(id, data) {
        const targetClassIds = data.classIds !== undefined ? data.classIds : data.classId ? [data.classId] : undefined;
        return prisma.material.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.content && { content: data.content }),
                ...(data.status && { status: data.status }),
                ...(targetClassIds !== undefined && {
                    classes: {
                        deleteMany: {},
                        create: targetClassIds.map((classId) => ({ classId })),
                    },
                }),
                ...(data.attachments && {
                    attachments: {
                        deleteMany: {},
                        create: data.attachments,
                    },
                }),
            },
            include: {
                attachments: true,
                classes: {
                    include: { class: { select: { id: true, name: true } } },
                },
                teacher: {
                    select: {
                        id: true,
                        fullname: true,
                        prefixTitle: true,
                        suffixTitle: true,
                        pictureUrl: true,
                        subjectTeachers: {
                            include: {
                                subject: { select: { id: true, name: true, code: true } },
                            },
                        },
                    },
                },
            },
        });
    }
    async delete(id) {
        return prisma.material.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async bulkDelete(ids) {
        return prisma.material.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() },
        });
    }
}
export const materialRepository = new MaterialRepository();
