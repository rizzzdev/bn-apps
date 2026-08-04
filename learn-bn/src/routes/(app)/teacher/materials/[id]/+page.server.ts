import type { PageServerLoad } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, params }) => {
  try {
    const raw = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const apiBase = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
    const res = await fetch(`${apiBase}/learn/materials/${params.id}`);
    if (!res.ok) return { material: null };
    const body = await res.json();
    return {
      material: body.data ?? null,
    };
  } catch {
    return {
      material: null,
    };
  }
};
