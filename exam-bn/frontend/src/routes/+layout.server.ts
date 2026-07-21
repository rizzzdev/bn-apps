import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, cookies }) => {
	return {
		user: locals.user,
		token: cookies.get('access_token') ?? ''
	};
};
