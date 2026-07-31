import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { profileData } = await parent();
  return {
    teacherId: profileData?.teacherId ?? null,
  };
};
