import { redirect } from '@sveltejs/kit';
import { PUBLIC_PORTAL_URL } from '$env/static/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	if (!cookies.get('refresh_token')) {
		const portalUrl = (PUBLIC_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
		throw redirect(303, `${portalUrl}/login`);
	}
};
