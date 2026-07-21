import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	
	if (user && user.roles) {
		if (user.roles.includes('super_admin')) {
			throw redirect(303, '/admin');
		}
		if (user.roles.includes('teacher')) {
			throw redirect(303, '/teacher');
		}
		if (user.roles.includes('student')) {
			throw redirect(303, '/student');
		}
		if (user.roles.includes('industry_mentor')) {
			throw redirect(303, '/mentor');
		}
	}
	
	return {};
};
