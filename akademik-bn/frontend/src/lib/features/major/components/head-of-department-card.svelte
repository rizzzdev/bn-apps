<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import type { MajorHead, ShadowTeacher } from '$lib/types';
	import { getPictureUrl, getInitials, formatTeacherName } from '$lib/utils/image';

	let { majorHead, teachers } = $props<{
		majorHead: MajorHead | null;
		teachers: ShadowTeacher[];
	}>();

	let teacherData = $derived(
		majorHead ? teachers.find((t: ShadowTeacher) => t.id === majorHead.teacherId) : null
	);
	let teacherName = $derived(formatTeacherName(teacherData));
	let teacherNip = $derived(teacherData?.nip ?? '-');
	let teacherPicture = $derived(getPictureUrl(teacherData?.pictureUrl));
</script>

<div
	class="bg-surface neo-border shadow-[6px_6px_0px_0px_#1C1B1B] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#1C1B1B] transition-all group relative overflow-hidden flex flex-col w-full max-w-full sm:max-w-sm"
>
	<div
		class="h-48 neo-border-b bg-tertiary-fixed relative overflow-hidden flex items-center justify-center"
	>
		{#if teacherPicture}
			<img
				src={teacherPicture}
				alt={teacherName}
				class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
			/>
		{:else if majorHead}
			<div
				class="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold font-data-mono text-4xl text-on-surface-variant uppercase group-hover:scale-105 transition-transform"
			>
				{getInitials(teacherData?.fullname)}
			</div>
		{:else}
			<div class="w-full h-full bg-surface-container-highest flex items-center justify-center">
				<Icon
					name="person"
					size="64px"
					class="text-on-surface-variant group-hover:scale-110 transition-transform"
				/>
			</div>
		{/if}
	</div>
	<div class="p-5 flex flex-col gap-2 flex-1 justify-between bg-surface relative overflow-hidden">
		<Icon
			name="admin_panel_settings"
			size="80px"
			class="absolute -right-4 -bottom-4 opacity-10 text-primary pointer-events-none"
			fill={true}
		/>
		{#if majorHead}
			<div>
				<h4
					class="font-headline-md text-headline-md font-bold leading-tight uppercase mb-3 relative z-10"
				>
					{teacherName}
				</h4>
				{#if teacherNip && teacherNip !== '-'}
					<span
						class="font-data-mono text-data-mono text-on-surface-variant bg-secondary-container w-fit px-3 py-1 neo-border font-bold text-xs relative z-10"
					>
						NIP: {teacherNip}
					</span>
				{/if}
			</div>
		{:else}
			<div>
				<h4
					class="font-headline-md text-headline-md font-bold leading-tight uppercase mb-2 relative z-10 opacity-50"
				>
					Belum ada kepala jurusan
				</h4>
				<span
					class="font-data-mono text-data-mono text-on-surface-variant opacity-50 text-xs relative z-10"
				>
					Tambahkan melalui menu Kepala Jurusan
				</span>
			</div>
		{/if}
	</div>
</div>
