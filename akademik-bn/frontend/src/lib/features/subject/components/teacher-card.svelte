<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { getPictureUrl, getInitials } from '$lib/utils/image';

	interface TeacherItem {
		id: string;
		fullname: string;
		nip: string;
		pictureUrl?: string | null;
	}

	let {
		teacher,
		index: _index = 0,
		selected = false,
		onToggle = () => {}
	} = $props<{ teacher: TeacherItem; index?: number; selected?: boolean; onToggle?: () => void }>();

	let pictureSrc = $derived(getPictureUrl(teacher.pictureUrl));
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
	<div
		class="h-48 neo-border-b bg-surface-variant relative overflow-hidden flex items-center justify-center"
	>
		{#if pictureSrc}
			<img
				src={pictureSrc}
				alt={teacher.fullname}
				class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
			/>
		{:else}
			<div
				class="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold font-data-mono text-4xl text-on-surface-variant uppercase group-hover:scale-105 transition-transform"
			>
				{getInitials(teacher.fullname)}
			</div>
		{/if}
	</div>
	<div class="p-4 flex flex-col justify-between flex-1">
		<div>
			<h4 class="font-headline-md text-headline-md font-bold leading-tight mb-3">
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
	</div>
</button>
