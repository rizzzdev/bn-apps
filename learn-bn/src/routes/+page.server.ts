import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const roles = (locals.user?.roles as string[] | undefined) || [];
	if (roles.includes('student')) {
		throw redirect(303, '/student');
	}
	throw redirect(303, '/teacher');
};
