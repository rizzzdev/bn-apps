<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { TooltipIconButton } from '$lib/components/molecules';
	import { formatTeacherName, getPictureUrl } from '$lib/utils/image';
	import type { ShadowTeacher } from '$lib/types';

	let {
		leaderData = null as ShadowTeacher | null,
		roleTitle = 'Pimpinan',
		emptyTitle = 'Belum Ada Pimpinan',
		onAssign
	}: {
		leaderData?: ShadowTeacher | null;
		roleTitle?: string;
		emptyTitle?: string;
		onAssign?: () => void;
	} = $props();

	function getInitials(name?: string) {
		if (!name) return '??';
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	const teacherPicture = $derived(
		leaderData?.pictureUrl ? getPictureUrl(leaderData.pictureUrl) : null
	);
</script>

<div
	class="bg-surface neo-border shadow-[4px_4px_0px_0px_#1C1B1B] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1C1B1B] transition-all group relative overflow-hidden flex flex-col w-full max-w-xs"
>
	<div
		class="h-32 neo-border-b bg-tertiary-fixed relative overflow-hidden flex items-center justify-center"
	>
		{#if teacherPicture}
			<img
				src={teacherPicture}
				alt={leaderData?.fullname}
				class="w-full h-full object-cover group-hover:scale-105 transition-transform"
			/>
		{:else if leaderData}
			<div
				class="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold font-data-mono text-2xl text-on-surface-variant uppercase group-hover:scale-105 transition-transform"
			>
				{getInitials(leaderData.fullname)}
			</div>
		{:else}
			<div class="w-full h-full bg-surface-container-low flex items-center justify-center">
				<Icon name="person" size="48px" class="text-on-surface-variant opacity-30" />
			</div>
		{/if}

		<div class="absolute top-2 right-2 flex gap-1">
			<span
				class="bg-primary text-on-primary font-data-mono text-[10px] font-bold px-1.5 py-0.5 neo-border-xs uppercase"
			>
				{roleTitle}
			</span>
		</div>
	</div>

	<div class="p-4 flex flex-col flex-1 justify-between gap-3">
		{#if leaderData}
			<div>
				<h4 class="font-headline-md text-base font-bold leading-tight uppercase mb-1 truncate">
					{formatTeacherName(leaderData)}
				</h4>
				<p class="font-data-mono text-xs text-on-surface-variant">
					NIP: {leaderData.nip || '-'}
				</p>
			</div>

			<div class="neo-border-t pt-2 flex items-center justify-between text-xs font-data-mono">
				<span class="text-on-surface-variant font-bold">STATUS</span>
				<span class="text-primary font-bold">AKTIF</span>
			</div>
		{:else}
			<div>
				<h4 class="font-headline-md text-base font-bold leading-tight uppercase mb-1 opacity-50">
					{emptyTitle}
				</h4>
				<p class="font-data-mono text-xs text-on-surface-variant opacity-50">
					Belum ada guru yang ditugaskan
				</p>
			</div>

			{#if onAssign}
				<Button variant="primary" size="sm" onclick={onAssign} class="w-full mt-2">
					<Icon name="person_add" size="14px" /> Tugaskan Guru
				</Button>
			{/if}
		{/if}
	</div>
</div>
