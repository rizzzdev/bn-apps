import type { PageServerLoad } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, params }) => {
  try {
    const res = await fetch(`${PUBLIC_API_URL}/materials/${params.id}`);
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
