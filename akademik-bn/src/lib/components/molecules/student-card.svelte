<script lang="ts">
	import { Checkbox, Badge } from '$lib/components/atoms';
	import { TooltipIconButton } from '$lib/components/molecules';
	import { getPictureUrl, getInitials } from '$lib/utils/image';
	import type { ShadowStudent } from '$lib/types';

	let {
		student = {} as ShadowStudent,
		isSelected = false,
		onToggleSelect,
		onRemove
	}: {
		student: ShadowStudent;
		isSelected?: boolean;
		onToggleSelect?: (student: ShadowStudent) => void;
		onRemove?: (student: ShadowStudent) => void;
	} = $props();

	let pictureSrc = $derived(getPictureUrl(student.pictureUrl));
</script>

<div
	class="bg-surface neo-border shadow-[4px_4px_0px_0px_#1C1B1B] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1C1B1B] transition-all group relative overflow-hidden flex flex-col w-full text-left {isSelected
		? 'bg-primary-container/20 ring-2 ring-primary'
		: ''}"
>
	{#if onToggleSelect}
		<div class="absolute top-2 left-2 z-10">
			<Checkbox
				checked={isSelected}
				onchange={() => onToggleSelect(student)}
				class="shadow-[2px_2px_0px_0px_#1C1B1B]"
			/>
		</div>
	{/if}

	<div
		class="h-32 neo-border-b bg-surface-variant relative overflow-hidden flex items-center justify-center"
	>
		{#if pictureSrc}
			<img
				src={pictureSrc}
				alt={student.fullname}
				class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
			/>
		{:else}
			<div
				class="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold font-data-mono text-2xl text-on-surface-variant uppercase group-hover:scale-105 transition-transform"
			>
				{getInitials(student.fullname)}
			</div>
		{/if}
	</div>

	<div class="p-3 flex flex-col justify-between flex-1 gap-2">
		<div>
			<h4 class="font-headline-md text-base font-bold leading-tight mb-1">
				{student.fullname}
			</h4>
			{#if student.nisn || student.nis}
				<div class="flex flex-col gap-1.5 font-data-mono text-xs mt-1">
					{#if student.nisn}
						<div class="flex items-center justify-between gap-2">
							<span class="text-on-surface-variant font-semibold">NISN:</span>
							<span class="font-bold bg-secondary-fixed border-2 border-on-background px-2 py-0.5"
								>{student.nisn}</span
							>
						</div>
					{/if}
					{#if student.nis}
						<div class="flex items-center justify-between gap-2">
							<span class="text-on-surface-variant font-semibold">NIS:</span>
							<span class="font-bold bg-secondary-fixed border-2 border-on-background px-2 py-0.5"
								>{student.nis}</span
							>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="pt-2 border-t border-on-surface/20 flex items-center justify-between gap-2">
			<Badge variant={student.status === 'Aktif' ? 'success' : 'default'}>
				{student.status || 'Aktif'}
			</Badge>

			{#if onRemove}
				<TooltipIconButton
					icon="delete"
					tooltip="Hapus dari Pemetaan"
					variant="danger"
					onclick={() => onRemove(student)}
				/>
			{/if}
		</div>
	</div>
</div>
