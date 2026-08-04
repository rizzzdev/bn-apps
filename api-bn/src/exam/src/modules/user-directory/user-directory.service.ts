import { prisma } from '#exam/database/index.js';
import { getOrchestrator } from '#app/orchestrator.js';
import { toExamRole } from '#exam/utils/roles.js';
import { shadowSyncService } from '#exam/services/shadow-sync.service.js';

export type DirectoryRole = 'super_admin' | 'teacher' | 'student';

export interface DirectoryUser {
  id: string;
  fullname: string;
  email: string | null;
  role: DirectoryRole;
  pictureUrl?: string | null;
  className?: string | null;
}

/**
 * Direktori user untuk frontend exam — read-only.
 *
 * Sumber data:
 * - teacher      -> ShadowTeacher (sync dari master, status Aktif)
 * - student      -> ShadowStudent (sync dari master, status Aktif)
 * - super_admin  -> user sentri dengan role super_admin
 * - email        -> identifier sentri (auth_bn) / fallback email master
 */
export class UserDirectoryService {
  private emailCache = new Map<string, string>();

  private async loadEmails(userIds: string[]): Promise<void> {
    const missing = userIds.filter((id) => !this.emailCache.has(id));
    if (missing.length === 0) return;

    try {
      const orchestrator = getOrchestrator();
      const users = await orchestrator.authData.findUsersByIds(missing);
      for (const user of users) {
        const email = user.identifiers.find((i) => i.type === 'email')?.value ?? null;
        if (email) this.emailCache.set(user.id, email);
        else this.emailCache.set(user.id, '');
      }
    } catch {
      // auth DB tidak tersedia — email dibiarkan null
    }
  }

  private async toDirectoryUser(
    id: string,
    fullname: string,
    role: DirectoryRole,
    masterEmail?: string | null,
    userId?: string | null,
    pictureUrl?: string | null,
    className?: string | null,
  ): Promise<DirectoryUser> {
    let email: string | null = masterEmail ?? null;
    if (!email && userId) {
      await this.loadEmails([userId]);
      email = this.emailCache.get(userId) ?? null;
    }
    const name = fullname?.trim() || 'Super Admin';
    return { id, fullname: name, email: email || null, role, pictureUrl: pictureUrl ?? null, className: className ?? null };
  }

  async me(userId: string, roles: string[]): Promise<DirectoryUser> {
    // Pemicu lazy sync agar data shadow segar (fail-safe)
    await shadowSyncService.lazySyncAll().catch(() => {});

    const examRole = toExamRole(roles ?? []);

    const teacher = await prisma.shadowTeacher.findFirst({ where: { userId, deletedAt: null } });
    if (teacher) {
      return this.toDirectoryUser(userId, teacher.fullname, 'teacher', teacher.email, userId, teacher.pictureUrl);
    }

    const student = await prisma.shadowStudent.findFirst({ where: { userId, deletedAt: null } });
    if (student) {
      const cs = await prisma.shadowClassStudent.findFirst({
        where: { studentId: student.id, status: 'Aktif', deletedAt: null },
      });
      let className: string | null = null;
      if (cs) {
        const sc = await prisma.shadowClass.findFirst({ where: { id: cs.classId, deletedAt: null } });
        if (sc) className = sc.name;
      }
      return this.toDirectoryUser(userId, student.fullname, 'student', null, userId, student.pictureUrl, className);
    }

    // Fallback: user sentri tanpa shadow (mis. super_admin atau role sentri lainnya)
    try {
      const orchestrator = getOrchestrator();
      const masterTeacher = await orchestrator.masterTeacher.findByUserId(userId);
      if (masterTeacher) {
        return this.toDirectoryUser(userId, masterTeacher.fullname, 'teacher', masterTeacher.email, userId, masterTeacher.pictureUrl);
      }
      const masterStudent = await orchestrator.masterStudent.findByUserId(userId);
      if (masterStudent) {
        return this.toDirectoryUser(userId, masterStudent.fullname, 'student', null, userId, masterStudent.pictureUrl);
      }
    } catch {
      // master tidak tersedia
    }

    const primaryRole = (examRole || (roles && roles[0]) || 'unauthorized') as DirectoryRole;
    const name = primaryRole === 'super_admin' ? 'Super Admin' : '';
    return this.toDirectoryUser(userId, name, primaryRole, null, userId, null);
  }


  async getAll(role?: string, limit = 1000, examRoomId?: string): Promise<DirectoryUser[]> {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 1000, 1), 2000);

    try {
      const orchestrator = getOrchestrator();

      const admins: DirectoryUser[] = [];
      const supervisors: DirectoryUser[] = [];
      const participants: DirectoryUser[] = [];

      const want = (r: DirectoryRole): boolean => !role || role === r;

      if (want('super_admin')) {
        try {
          const superAdmins = await orchestrator.authData.findAllByRoles(['super_admin']);
          for (const sa of superAdmins) {
            admins.push({ id: sa.id, fullname: 'Super Admin', email: sa.email, role: 'super_admin', pictureUrl: null });
          }
        } catch {
          // auth tidak tersedia
        }
      }

      if (want('teacher')) {
        const teachers = await prisma.shadowTeacher.findMany({
          where: { deletedAt: null },
          orderBy: { fullname: 'asc' },
        });
        await this.loadEmails(teachers.map((t) => t.userId));
        for (const t of teachers) {
          supervisors.push(
            await this.toDirectoryUser(t.userId, t.fullname, 'teacher', t.email, t.userId, t.pictureUrl),
          );
        }
      }

      if (want('student')) {
        let allowedStudentUserIds: string[] | null = null;

        if (examRoomId) {
          const roomClasses = await prisma.examRoomClass.findMany({
            where: { examRoomId, deletedAt: null },
            select: { classId: true },
          });
          const classIds = roomClasses.map((c) => c.classId);

          if (classIds.length === 0) {
            // Rule: if no classes are assigned to exam room, return 0 students
            allowedStudentUserIds = [];
          } else {
            const classStudents = await prisma.shadowClassStudent.findMany({
              where: { classId: { in: classIds }, status: 'Aktif', deletedAt: null },
              select: { studentId: true },
            });
            const studentIds = [...new Set(classStudents.map((cs) => cs.studentId))];
            if (studentIds.length > 0) {
              const studentsInClasses = await prisma.shadowStudent.findMany({
                where: { id: { in: studentIds }, deletedAt: null },
                select: { userId: true },
              });
              allowedStudentUserIds = studentsInClasses.map((s) => s.userId).filter(Boolean);
            } else {
              allowedStudentUserIds = [];
            }
          }
        }

        if (!allowedStudentUserIds || allowedStudentUserIds.length > 0) {
          const students = await prisma.shadowStudent.findMany({
            where: {
              deletedAt: null,
              ...(allowedStudentUserIds ? { userId: { in: allowedStudentUserIds } } : {}),
            },
            orderBy: { fullname: 'asc' },
          });

          const studentIds = students.map((s) => s.id);
          const studentClassMap = new Map<string, string>();
          if (studentIds.length > 0) {
            const classStudents = await prisma.shadowClassStudent.findMany({
              where: { studentId: { in: studentIds }, status: 'Aktif', deletedAt: null },
              select: { studentId: true, classId: true },
            });
            const classIds = [...new Set(classStudents.map((cs) => cs.classId))];
            if (classIds.length > 0) {
              const shadowClasses = await prisma.shadowClass.findMany({
                where: { id: { in: classIds }, deletedAt: null },
                select: { id: true, name: true },
              });
              const classNameMap = new Map(shadowClasses.map((c) => [c.id, c.name]));
              for (const cs of classStudents) {
                const cName = classNameMap.get(cs.classId);
                if (cName) studentClassMap.set(cs.studentId, cName);
              }
            }
          }

          await this.loadEmails(students.map((s) => s.userId));
          for (const s of students) {
            const className = studentClassMap.get(s.id) ?? null;
            participants.push(
              await this.toDirectoryUser(s.userId, s.fullname, 'student', null, s.userId, s.pictureUrl, className),
            );
          }
        }
      }

      const all = [...admins, ...supervisors, ...participants].sort((a, b) =>
        a.fullname.localeCompare(b.fullname),
      );
      return all.slice(0, safeLimit);
    } catch (error) {
      console.error('[UserDirectoryService] getAll failed:', error);
      return [];
    }
  }

  async getById(userId: string): Promise<DirectoryUser | null> {
    try {
      const users = await this.getAll();
      return users.find((u) => u.id === userId) ?? null;
    } catch {
      return null;
    }
  }
}

export const userDirectoryService = new UserDirectoryService();

