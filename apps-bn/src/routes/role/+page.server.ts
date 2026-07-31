import type { PageServerLoad } from './$types.js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getApiUrl = (): string => {
	return env.API_URL || publicEnv.PUBLIC_API_URL || 'http://localhost:3000';
};

export const load: PageServerLoad = async ({ fetch, cookies, parent, url }) => {
	const parentData = await parent();
	const user = parentData?.user;

	// Check if user has super_admin role
	const isSuperAdmin = Boolean(
		user?.roles &&
		(Array.isArray(user.roles) ? user.roles.includes('super_admin') : user.roles === 'super_admin')
	);

	if (!isSuperAdmin) {
		return {
			isSuperAdmin: false,
			users: [],
			roles: [],
			pagination: { currentPage: 1, totalPage: 1, totalData: 0, dataPerPage: 10 }
		};
	}

	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '10';
	const search = url.searchParams.get('search') || '';

	const apiUrl = getApiUrl();
	const token = cookies.get('access_token');
	try {
		const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
		const res = await fetch(`${apiUrl}/auth/users?page=${page}&limit=${limit}${searchParam}`, {
			headers: { 
				Authorization: token ? `Bearer ${token}` : ''
			}
		});
		
		const rolesRes = await fetch(`${apiUrl}/auth/users/roles`, {
			headers: { 
				Authorization: token ? `Bearer ${token}` : ''
			}
		});

		if (!res.ok || !rolesRes.ok) {
			console.warn(`Users or Roles API returned non-ok status (users: ${res.status}, roles: ${rolesRes.status})`);
			return {
				users: [],
				roles: [],
				pagination: { currentPage: 1, totalPage: 1, totalData: 0, dataPerPage: 10 }
			};
		}
		
		const data = await res.json();
		const rolesData = await rolesRes.json();
		
		return {
			isSuperAdmin: true,
			users: data.data || [],
			roles: rolesData.data || [],
			pagination: data.pagination || { currentPage: Number(page), totalPage: 1, totalData: (data.data || []).length, dataPerPage: Number(limit) }
		};
	} catch (err) {
		console.error('Failed to load users:', err);
		return {
			users: [],
			roles: [],
			pagination: { currentPage: 1, totalPage: 1, totalData: 0, dataPerPage: 10 }
		};
	}
};
