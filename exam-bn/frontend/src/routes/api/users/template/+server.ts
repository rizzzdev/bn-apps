import type { RequestHandler } from './$types';
import { BACKEND_URL } from '$lib/server/api';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('access_token') ?? '';
	const res = await fetch(`${BACKEND_URL}/api/v1/users/template`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		return new Response('Gagal mengunduh template', { status: 500 });
	}

	const blob = await res.arrayBuffer();
	return new Response(blob, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="template_user.xlsx"'
		}
	});
};
