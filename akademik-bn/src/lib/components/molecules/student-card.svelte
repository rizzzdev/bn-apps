<script lang="ts">
	import { Icon, Checkbox, Badge } from '$lib/components/atoms';
	import { TooltipIconButton } from '$lib/components/molecules';
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
</script>

<div
	class="bg-surface neo-border p-3 flex items-center justify-between gap-3 transition-all hover:translate-x-0.5 hover:translate-y-0.5 neo-shadow-xs {isSelected
		? 'bg-primary-container/20 border-primary'
		: ''}"
>
	<div class="flex items-center gap-3 min-w-0">
		{#if onToggleSelect}
			<Checkbox
				checked={isSelected}
				onchange={() => onToggleSelect(student)}
				class="shrink-0"
			/>
		{/if}

		<div class="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold font-data-mono text-xs shrink-0 neo-border-xs">
			{student.fullname ? student.fullname.substring(0, 2).toUpperCase() : '??'}
		</div>

		<div class="flex flex-col min-w-0">
			<span class="font-body-md text-xs font-bold text-on-surface truncate">
				{student.fullname}
			</span>
			<div class="flex items-center gap-2 font-data-mono text-[10px] text-on-surface-variant">
				{#if student.nisn}<span>NISN: {student.nisn}</span>{/if}
				{#if student.nis}<span>NIS: {student.nis}</span>{/if}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-2 shrink-0">
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
