import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkRoleAccess } from '$lib/constants/roles';
import { getEmailFromUser } from '$lib/utils/helpers';
import { fetchApi } from '$lib/utils/server-api';
import type { ProfileData } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals, url, cookies, fetch }) => {
	const path = url.pathname;
	const user = locals.user;

	if (user && checkRoleAccess(path, user.roles ?? [])) {
		throw redirect(303, '/403');
	}

	let profileData: ProfileData | null = null;
	if (user) {
		const userEmail = getEmailFromUser(user);
		if (userEmail) {
			const result = await fetchApi<ProfileData>(
				`/dashboard/profile?email=${encodeURIComponent(userEmail)}`,
				{ fetch, cookies },
			);
			if (result.data) {
				profileData = result.data;
			}
		}
	}

	return {
		user,
		profileData
	};
};
