import type { PageServerLoad } from './$types';
import { getEmailFromUser } from '$lib/utils/helpers';
import { fetchApi } from '$lib/utils/server-api';
import type { DashboardStats } from '$lib/types';

export const load: PageServerLoad = async ({ parent, fetch, cookies }) => {
  const parentData = await parent();
  const { profileData, user } = parentData;

  const email = getEmailFromUser(user);

  let dashboardStats: DashboardStats | null = null;
  if (email) {
    const result = await fetchApi<DashboardStats>(
      `/api/v1/dashboard/student?email=${encodeURIComponent(email)}`,
      { fetch, cookies },
    );
    if (result.data) {
      dashboardStats = result.data;
    }
  }

  return {
    placementId: profileData?.placementId ?? null,
    currentUserId: profileData?.studentId ?? null,
    dashboardStats
  };
};
