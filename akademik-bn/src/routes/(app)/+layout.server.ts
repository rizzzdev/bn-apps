import type { LayoutServerLoad } from './$types';
import { env as publicEnv } from '$env/dynamic/public';
import type { CurrentUser, TeacherProfile } from '$lib/types';

const getApiUrl = (): string => {
	const raw = (
		(publicEnv as Record<string, string | undefined>).PUBLIC_API_URL || 'http://localhost:3000'
	).replace(/\/+$/, '');
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
};

export const load: LayoutServerLoad = async ({ locals, cookies, fetch }) => {
	const user = (locals.user as CurrentUser | undefined) ?? null;

	// Resolve profil dari data guru (master) berdasarkan userId user yang login.
	// Endpoint shadow tidak mendukung filter userId, jadi gunakan /master/teachers.
	let profile: TeacherProfile | null = null;
	if (user?.id) {
		const token = cookies.get('access_token');
		if (token) {
			try {
				const res = await fetch(
					`${getApiUrl()}/master/teachers?userId=${encodeURIComponent(user.id)}&limit=1`,
					{
						headers: {
							Authorization: `Bearer ${token}`
						}
					}
				);
				if (res.ok) {
					const json = (await res.json().catch(() => null)) as {
						data?: TeacherProfile[] | null;
					} | null;
					if (json?.data?.length) profile = json.data[0];
				}
			} catch {
				// Profil tidak wajib — komponen UI memiliki fallback nama default.
			}
		}
	}

	return { user, profile, accessDenied: locals.accessDenied ?? false };
};
