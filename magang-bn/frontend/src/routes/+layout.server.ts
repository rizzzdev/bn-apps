import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { ROLE_PATHS } from '$lib/constants/roles';
import { getEmailFromUser } from '$lib/utils/helpers';
import { fetchApi } from '$lib/utils/server-api';
import type { ProfileData } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals, url, cookies, fetch }) => {
	const path = url.pathname;
	const user = locals.user;

	if (user) {
		let requiresRole = '';
		for (const [pathPrefix, role] of Object.entries(ROLE_PATHS)) {
			if (path.startsWith(pathPrefix)) {
				requiresRole = role;
				break;
			}
		}
		if (requiresRole && (!user.roles || !user.roles.includes(requiresRole))) {
			throw redirect(303, '/403');
		}
	}

	let profileData: ProfileData | null = null;
	if (user) {
		const userEmail = getEmailFromUser(user);
		if (userEmail) {
			const result = await fetchApi<ProfileData>(
				`/api/v1/dashboard/profile?email=${encodeURIComponent(userEmail)}`,
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
