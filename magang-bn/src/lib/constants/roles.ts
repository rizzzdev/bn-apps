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

export function getRoleFromPath(pathname: string): string {
	for (const [prefix, role] of Object.entries(ROLE_PATHS)) {
		if (pathname.startsWith(prefix)) return role;
	}
	return '';
}

export function checkRoleAccess(pathname: string, userRoles: string[]): string | null {
	const required = getRoleFromPath(pathname);
	if (required && !userRoles.includes(required)) {
		return required;
	}
	return null;
}
