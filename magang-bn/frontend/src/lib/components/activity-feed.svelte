<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { apiClient } from '$lib/utils/api';
  import { Pagination } from '$lib/components/molecules';

  // Props — pass salah satu sesuai konteks user:
  // placementId → student | mentorId → mentor | teacherId → teacher | (kosong) → admin
  let { placementId, currentUserId, mentorId, teacherId, role } = $props<{ 
    placementId?: string | null, 
    currentUserId?: string | null,
    mentorId?: string | null,
    teacherId?: string | null,
    role?: 'student' | 'mentor' | 'teacher' | 'admin'
  }>();

  let activities = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');
  
  let page = $state(1);
  let totalPages = $state(1);

  async function loadPage(p: number) {
    if (p < 1 || (totalPages && p > totalPages)) return;
    loading = true;
    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      params.set('page', p.toString());
      
      // Strict filtering based on role
      if (role === 'student') {
        params.set('placementId', placementId || 'unplaced');
      } else if (role === 'mentor') {
        params.set('mentorId', mentorId || 'unassigned');
      } else if (role === 'teacher') {
        params.set('teacherId', teacherId || 'unassigned');
      }
      // If role === 'admin' or undefined, no filter is applied (fetches all)
      
      const res = await apiClient(`/api/v1/activities?${params.toString()}`);
      if (res?.error || !res?.data) throw new Error(res?.message || 'Gagal mengambil aktivitas');
      activities = res.data || [];
      if (res.pagination) {
        totalPages = res.pagination.totalPage || 1;
      }
      page = p;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => loadPage(1));

  // ────────────────────────────────────────────────────────────────────────────
  // Visual helpers
  // ────────────────────────────────────────────────────────────────────────────
  const ACTION_META: Record<string, { icon: string; color: string }> = {
    PLACEMENT_CREATED:        { icon: '🏢', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    PLACEMENT_STATUS_UPDATED: { icon: '🔄', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    CERTIFICATE_UPLOADED:     { icon: '🎓', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    MENTOR_CREATED:           { icon: '👨‍💼', color: 'bg-teal-100 text-teal-700 border-teal-300' },
    COMPANY_CREATED:          { icon: '🏭', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    LOGBOOK_CREATED:          { icon: '📝', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    LOGBOOK_APPROVED:         { icon: '✅', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    LOGBOOK_REJECTED:         { icon: '↩️', color: 'bg-rose-100 text-rose-700 border-rose-300' },
    ATTENDANCE_CHECKIN:       { icon: '📍', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    ATTENDANCE_CHECKOUT:      { icon: '🚪', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    ASSESSMENT_SUBMITTED:     { icon: '⭐', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  };

  function getIcon(action: string) { return ACTION_META[action]?.icon ?? '🔔'; }
  function getColor(action: string) { return ACTION_META[action]?.color ?? 'bg-gray-100 text-gray-600 border-gray-200'; }

  function roleBadge(role: string) {
    const map: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      teacher: 'bg-blue-100 text-blue-700',
      mentor: 'bg-teal-100 text-teal-700',
      student: 'bg-purple-100 text-purple-700',
    };
    return map[role] ?? 'bg-gray-100 text-gray-600';
  }
</script>

<div class="w-full border-4 border-on-background bg-surface shadow-neo animate-fade-in-up mt-8" style="animation-delay: 0.1s; animation-fill-mode: both;">
  <div class="border-b-4 border-on-background p-4 bg-slate-50 flex justify-between items-center">
    <h3 class="font-headline font-black text-xl uppercase tracking-tight flex items-center gap-2">
      <span class="text-2xl">⚡</span> Aktivitas Terbaru
    </h3>
    <button
      class="px-3 py-1 bg-primary text-surface font-bold uppercase text-xs border-2 border-on-background hover:bg-secondary transition-colors"
      onclick={() => location.reload()}
    >
      Refresh
    </button>
  </div>

  <div class="p-4 bg-white">
    {#if loading}
      <div class="space-y-4" transition:fade>
        {#each Array(3) as _}
          <div class="animate-pulse flex gap-4">
            <div class="w-10 h-10 border-2 border-on-background bg-slate-200 shrink-0"></div>
            <div class="flex-1 space-y-2 py-1">
              <div class="h-4 bg-slate-200 w-3/4 border-2 border-on-background"></div>
              <div class="h-3 bg-slate-200 w-1/2 border-2 border-on-background"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="p-4 bg-error text-surface font-bold border-2 border-on-background flex gap-2 items-start" transition:slide>
        <span>⚠️</span> {error}
      </div>
    {:else if activities.length === 0}
      <div class="text-center py-10" transition:fade>
        <div class="text-4xl mb-3 opacity-50 grayscale">📭</div>
        <p class="font-bold font-mono">Belum ada aktivitas baru.</p>
      </div>
    {:else}
      <div class="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-on-background">
        {#each activities as activity (activity.id)}
          <div
            class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            transition:slide
          >
            <!-- Icon bubble -->
            <div class="flex items-center justify-center w-10 h-10 border-2 border-on-background shadow-[2px_2px_0px_#000] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-lg {getColor(activity.action)}">
              {getIcon(activity.action)}
            </div>

            <!-- Card -->
            <div class="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-4 border-2 border-on-background shadow-[4px_4px_0px_#000] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000]">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <!-- Action badge -->
                {#if activity.action}
                  <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-on-background {getColor(activity.action)}">
                    {activity.action.replace(/_/g, ' ')}
                  </span>
                {/if}
                <!-- Role badge -->
                {#if activity.actorRole}
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full {roleBadge(activity.actorRole)}">
                    {activity.actorRole}
                  </span>
                {/if}
              </div>

              <!-- Dynamic description from template -->
              <p class="text-sm font-bold text-on-background leading-snug mt-1">
                {activity.description || activity.action}
              </p>

              <!-- Timestamp + Actor -->
              <div class="flex items-center justify-between mt-2 flex-wrap gap-1">
                <time class="text-xs text-secondary font-mono">
                  🕒 {new Date(activity.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
                <span class="text-xs font-mono text-secondary truncate max-w-[140px]">
                  {activity.actorName ?? ''}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
      <!-- Pagination Controls -->
      {#if totalPages > 1}
        <div class="mt-8 pt-4 border-t-2 border-dashed border-slate-200 flex justify-center">
          <Pagination bind:currentPage={page} {totalPages} onPageChange={(p) => loadPage(p)} />
        </div>
      {/if}
    {/if}
  </div>
</div>
