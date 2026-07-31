import type { PageServerLoad } from './$types.js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getApiUrl = (): string => {
	return env.API_URL || publicEnv.PUBLIC_API_URL || 'http://localhost:3000';
};

export const load: PageServerLoad = async ({ fetch, cookies, parent, url }) => {
	const parentData = await parent();
	const user = parentData?.user;

	const isSuperAdmin = Boolean(
		user?.roles &&
		(Array.isArray(user.roles) ? user.roles.includes('super_admin') : user.roles === 'super_admin')
	);

	if (!isSuperAdmin) {
		return {
			isSuperAdmin: false,
			user,
			applications: [],
			pagination: { currentPage: 1, totalPage: 1, totalData: 0, dataPerPage: 10 }
		};
	}

	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '100'; // Load larger batch or page size for table

	const apiUrl = getApiUrl();
	const token = cookies.get('access_token');

	try {
		const res = await fetch(`${apiUrl}/master/applications?page=${page}&limit=${limit}`, {
			headers: {
				Authorization: token ? `Bearer ${token}` : ''
			}
		});

		if (!res.ok) {
			console.warn(`Master Service Applications API returned status ${res.status}`);
			return {
				isSuperAdmin,
				user,
				applications: [],
				pagination: { currentPage: Number(page), totalPage: 1, totalData: 0, dataPerPage: Number(limit) }
			};
		}

		const responseData = await res.json();
		return {
			isSuperAdmin,
			user,
			applications: responseData.data || [],
			pagination: responseData.pagination || {
				currentPage: Number(page),
				totalPage: 1,
				totalData: (responseData.data || []).length,
				dataPerPage: Number(limit)
			}
		};
	} catch (err) {
		console.error('Failed to load applications from Master Service:', err);
		return {
			isSuperAdmin,
			user,
			applications: [],
			pagination: { currentPage: Number(page), totalPage: 1, totalData: 0, dataPerPage: Number(limit) }
		};
	}
};

