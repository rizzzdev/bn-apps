import type { PageServerLoad } from './$types.js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getApiUrl = (): string => {
	const raw = (env.API_URL || publicEnv.PUBLIC_API_URL || 'http://localhost:3000').replace(
		/\/+$/,
		''
	);
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
};

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
	const parentData = await parent();
	const user = parentData?.user;

	const apiUrl = getApiUrl();
	const token = cookies.get('access_token');

	try {
		const res = await fetch(`${apiUrl}/master/applications?page=1&limit=100`, {
			headers: {
				Authorization: token ? `Bearer ${token}` : ''
			}
		});

		if (res.ok) {
			const responseData = await res.json();
			return {
				user,
				applications: responseData.data || []
			};
		}
	} catch (err) {
		console.error('Failed to load applications for dashboard:', err);
	}

	return {
		user,
		applications: []
	};
};
