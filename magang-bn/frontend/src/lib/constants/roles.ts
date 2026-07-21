export const ROLE_PATHS: Record<string, string> = {
	'/admin': 'super_admin',
	'/student': 'student',
	'/teacher': 'teacher',
	'/mentor': 'industry_mentor'
};

export const ROLE_NAMES: Record<string, string> = {
	super_admin: 'Admin',
	teacher: 'Guru',
	student: 'Murid',
	industry_mentor: 'Mentor Industri'
};

export const ROLE_PREFIXES = ['/admin', '/student', '/teacher', '/mentor'] as const;
