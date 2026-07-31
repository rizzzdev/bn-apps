<script lang="ts">
	import type { LessonSchedule } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let { schedule = [], type = 'student' } = $props<{
		schedule: LessonSchedule[];
		type?: 'student' | 'teacher';
	}>();

	const BASE_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

	function buildGrid(data: LessonSchedule[]) {
		const hourMap = new Map<number, { startTime: string; endTime: string }>();
		const grid = new Map<string, Map<number, LessonSchedule[]>>();

		const hasSaturday = data.some((s) => s.day === 'Sabtu');
		const days = hasSaturday ? [...BASE_DAYS, 'Sabtu'] : [...BASE_DAYS];

		for (const day of days) grid.set(day, new Map());

		let maxHour = 10;

		for (const entry of data) {
			if (entry.lessonHour?.order && entry.lessonHour.order > maxHour) {
				maxHour = entry.lessonHour.order;
			}
			if (entry.day && entry.lessonHour) {
				let dayGrid = grid.get(entry.day);
				if (!dayGrid) {
					dayGrid = new Map();
					grid.set(entry.day, dayGrid);
				}

				const existingList = dayGrid.get(entry.lessonHour.order) || [];
				existingList.push(entry);
				dayGrid.set(entry.lessonHour.order, existingList);

				if (!hourMap.has(entry.lessonHour.order)) {
					hourMap.set(entry.lessonHour.order, {
						startTime: entry.lessonHour.startTime,
						endTime: entry.lessonHour.endTime
					});
				}
			}
		}
		return { days, maxHour, hourMap, grid };
	}

	function formatTeacherName(t: { fullname: string; prefixTitle?: string | null; suffixTitle?: string | null }): string {
		let name = t.fullname;
		if (t.prefixTitle?.trim()) {
			name = `${t.prefixTitle.trim()} ${name}`;
		}
		if (t.suffixTitle?.trim()) {
			name = `${name}, ${t.suffixTitle.trim()}`;
		}
		return name;
	}

	let gridData = $derived(buildGrid(schedule));
</script>

{#if schedule.length === 0}
	<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-12 text-center flex flex-col items-center">
		<div class="w-16 h-16 bg-primary-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 mb-6">
			<span class="material-symbols-outlined text-4xl">calendar_month</span>
		</div>
		<h4 class="font-headline-md text-xl font-bold mb-2">Belum Ada Jadwal</h4>
		<p class="font-body-md text-secondary">
			{type === 'teacher' ? 'Anda belum memiliki jadwal mengajar untuk pekan ini.' : 'Anda belum memiliki jadwal pelajaran untuk pekan ini.'}
		</p>
	</div>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
			<thead>
				<tr class="bg-surface border-b-2 border-on-surface">
					<th class="font-label-bold text-sm uppercase px-3 py-3 whitespace-nowrap w-16 text-center">Jam</th>
					<th class="font-label-bold text-sm uppercase px-3 py-3 whitespace-nowrap w-28 text-center">Waktu</th>
					{#each gridData.days as day}
						<th class="font-label-bold text-sm uppercase px-3 py-3 whitespace-nowrap text-center border-l border-outline-variant min-w-[140px]">{day}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each Array.from({ length: gridData.maxHour }, (_, i) => i + 1) as order}
					{@const hour = gridData.hourMap.get(order)}
					<tr class="border-b border-outline-variant hover:bg-primary-container/10 transition-colors">
						<td class="px-2 py-3 font-label-bold text-sm text-center bg-surface-container-low/50">{order}</td>
						<td class="px-2 py-3 font-body-md text-xs text-center whitespace-nowrap text-secondary bg-surface-container-low/50">
							{#if hour}
								{hour.startTime} - {hour.endTime}
							{:else}
								-
							{/if}
						</td>
						{#each gridData.days as day}
							{@const entries = gridData.grid.get(day)?.get(order)}
							<td class="px-2.5 py-2.5 border-l border-outline-variant align-top">
								{#if entries && entries.length > 0}
									<div class="flex flex-col gap-2">
										{#each entries as entry}
											<div class="flex flex-col gap-1.5 p-2.5 bg-primary-container/20 neo-border shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] rounded-none">
												<span class="font-label-bold text-xs text-on-surface leading-tight font-bold">{entry.subject?.name}</span>
												
												{#if type === 'student'}
													<!-- Tampilkan Pengajar untuk Murid -->
													{#if entry.teachers && entry.teachers.length > 0}
														<div class="flex flex-wrap gap-1">
															{#each entry.teachers as t}
																<Badge variant="outline">{formatTeacherName(t.teacher)}</Badge>
															{/each}
														</div>
													{/if}
												{:else}
													<!-- Tampilkan Kelas untuk Guru -->
													{#if entry.classes && entry.classes.length > 0}
														<div class="flex flex-wrap gap-1">
															{#each entry.classes as cls}
																<Badge variant="outline">{cls.class.name}</Badge>
															{/each}
														</div>
													{/if}
												{/if}

												{#if entry.notes}
													<span class="text-[10px] text-secondary italic font-body-sm">{entry.notes}</span>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
