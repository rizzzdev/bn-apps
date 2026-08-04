export type ExamRole = 'super_admin' | 'teacher' | 'student';

/** Role exam memakai penamaan master (super_admin/teacher/student) secara langsung. */
export function toExamRole(roles: string[] = []): ExamRole | null {
	if (roles.includes('super_admin')) return 'super_admin';
	if (roles.includes('teacher')) return 'teacher';
	if (roles.includes('student')) return 'student';
	return null;
}
