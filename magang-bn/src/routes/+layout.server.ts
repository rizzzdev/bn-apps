import type { LayoutServerLoad } from './$types';
import { checkRoleAccess } from '$lib/constants/roles';
import { getEmailFromUser } from '$lib/utils/helpers';
import { fetchApi } from '$lib/utils/server-api';
import type { ProfileData } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals, url, cookies, fetch }) => {
	const path = url.pathname;
	const user = locals.user;

	const requiredRole = user ? checkRoleAccess(path, user.roles ?? []) : null;
	if (requiredRole) {
		return { user, profileData: null, accessDenied: true, requiredRole };
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
