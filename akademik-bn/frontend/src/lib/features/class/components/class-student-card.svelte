<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import type { Student } from '$lib/types';
	import { getPictureUrl, getInitials } from '$lib/utils/image';

	let {
		student,
		index: _index = 0,
		selected = false,
		onToggle = () => {}
	} = $props<{ student: Student; index?: number; selected?: boolean; onToggle?: () => void }>();

	let pictureSrc = $derived(getPictureUrl(student.pictureUrl));
</script>

<button
	class="bg-surface neo-border shadow-[6px_6px_0px_0px_#1C1B1B] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#1C1B1B] transition-all text-left flex flex-col w-full relative overflow-hidden"
	onclick={onToggle}
>
	<div class="absolute top-2 left-2 z-10">
		<div
			class="w-6 h-6 neo-border flex items-center justify-center cursor-pointer transition-colors {selected
				? 'bg-primary text-on-primary'
				: 'bg-white'}"
		>
			{#if selected}
				<Icon name="check" size="18px" />
			{/if}
		</div>
	</div>
	<div class="h-40 neo-border-b bg-tertiary-fixed overflow-hidden flex items-center justify-center">
		{#if pictureSrc}
			<img
				src={pictureSrc}
				alt={student.fullname}
				class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
			/>
		{:else}
			<div
				class="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold font-data-mono text-3xl text-on-surface-variant uppercase group-hover:scale-105 transition-transform"
			>
				{getInitials(student.fullname)}
			</div>
		{/if}
	</div>
	<div class="p-4 flex flex-col gap-2 flex-1 justify-between bg-surface">
		<h4 class="font-headline-md text-headline-md font-bold leading-tight">{student.fullname}</h4>
		{#if (student.nis && student.nis !== '-') || (student.nisn && student.nisn !== '-')}
			<div class="flex flex-col gap-1.5 mt-2">
				{#if student.nis && student.nis !== '-'}
					<div class="flex items-center justify-between">
						<span class="font-data-mono text-xs text-on-surface-variant font-semibold">NIS:</span>
						<span
							class="bg-secondary-fixed border-2 border-on-background px-2 py-0.5 font-data-mono text-xs font-bold"
							>{student.nis}</span
						>
					</div>
				{/if}
				{#if student.nisn && student.nisn !== '-'}
					<div class="flex items-center justify-between">
						<span class="font-data-mono text-xs text-on-surface-variant font-semibold">NISN:</span>
						<span
							class="bg-tertiary-fixed border-2 border-on-background px-2 py-0.5 font-data-mono text-xs font-bold"
							>{student.nisn}</span
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</button>
