<script lang="ts">
	import { Icon, Checkbox } from '$lib/components/atoms';
	import { getPictureUrl, getInitials } from '$lib/utils/image';

	interface TeacherItem {
		id: string;
		fullname: string;
		nip: string;
		pictureUrl?: string | null;
		subjectTeacherId: string;
		targetHours?: number;
	}

	let {
		teacher,
		index: _index = 0,
		selected = false,
		onToggle = () => {},
		onEditTargetHours = undefined
	} = $props<{
		teacher: TeacherItem;
		index?: number;
		selected?: boolean;
		onToggle?: () => void;
		onEditTargetHours?: (teacher: TeacherItem) => void;
	}>();

	let pictureSrc = $derived(getPictureUrl(teacher.pictureUrl));
</script>

<div
	class="bg-surface neo-border shadow-[4px_4px_0px_0px_#1C1B1B] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1C1B1B] transition-all text-left flex flex-col w-full relative overflow-hidden"
>
	<div class="absolute top-2 left-2 z-10">
		<Checkbox
			checked={selected}
			onchange={() => onToggle()}
			class="shadow-[2px_2px_0px_0px_#1C1B1B]"
		/>
	</div>

	<div
		class="h-32 neo-border-b bg-surface-variant relative overflow-hidden flex items-center justify-center"
	>
		{#if pictureSrc}
			<img
				src={pictureSrc}
				alt={teacher.fullname}
				class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
			/>
		{:else}
			<div
				class="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold font-data-mono text-2xl text-on-surface-variant uppercase group-hover:scale-105 transition-transform"
			>
				{getInitials(teacher.fullname)}
			</div>
		{/if}
	</div>

	<div class="p-3 flex flex-col justify-between flex-1 gap-2">
		<div>
			<h4 class="font-headline-md text-base font-bold leading-tight mb-1">
				{teacher.fullname}
			</h4>
			{#if teacher.nip && teacher.nip !== '-'}
				<div class="flex flex-col gap-1.5 font-data-mono text-xs">
					<div class="flex items-center justify-between">
						<span class="text-on-surface-variant font-semibold">NIP:</span>
						<span class="font-bold bg-secondary-fixed border-2 border-on-background px-2 py-0.5"
							>{teacher.nip}</span
						>
					</div>
				</div>
			{/if}
		</div>

		<!-- Target Hours Badge & Edit Action -->
		<div
			class="pt-2 border-t border-on-surface/20 flex items-center justify-between font-data-mono text-xs"
		>
			<span class="font-bold text-on-surface bg-tertiary-fixed border neo-border-xs px-2 py-1">
				Beban: {teacher.targetHours ?? 0} JP/minggu
			</span>

			{#if onEditTargetHours}
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						onEditTargetHours(teacher);
					}}
					class="p-1 neo-border bg-surface hover:bg-surface-container text-on-surface flex items-center gap-1 font-bold text-[10px] uppercase"
					title="Ubah Target JP"
				>
					<Icon name="edit" size="14px" />
					<span>Ubah</span>
				</button>
			{/if}
		</div>
	</div>
</div>
