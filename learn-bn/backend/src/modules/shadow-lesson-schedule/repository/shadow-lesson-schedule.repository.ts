import { prisma } from '@/database';

export class LessonScheduleRepository {
  async findAll(skip: number, take: number) {
    return prisma.lessonSchedule.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.lessonSchedule.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    return prisma.lessonSchedule.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  async upsertLessonHour(id: string, data: any) {
    return prisma.lessonHour.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  async deleteTeachersBySchedule(scheduleId: string) {
    return prisma.lessonScheduleTeacher.deleteMany({
      where: { lessonScheduleId: scheduleId },
    });
  }

  async createTeacher(data: any) {
    return prisma.lessonScheduleTeacher.create({ data });
  }

  async deleteClassesBySchedule(scheduleId: string) {
    return prisma.lessonScheduleClass.deleteMany({
      where: { lessonScheduleId: scheduleId },
    });
  }

  async createClass(data: any) {
    return prisma.lessonScheduleClass.create({ data });
  }
}

export const lessonScheduleRepository = new LessonScheduleRepository();
