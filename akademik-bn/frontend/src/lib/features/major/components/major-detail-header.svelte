<script lang="ts">
	import type { Major } from '$lib/types';

	let { major } = $props<{ major: Major }>();
</script>

<div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 neo-border-b pb-6">
	<div>
		<h2
			class="font-headline-lg md:font-headline-xl text-3xl md:text-headline-xl text-primary-container font-black"
		>
			Detail Jurusan:<br /><span class="text-on-surface">{major.name}</span>
		</h2>
		<div class="flex items-center gap-3 mt-3">
			<span
				class="border-2 border-on-background bg-primary-fixed text-on-background px-3 py-1 font-bold font-data-mono neo-shadow-xs text-xs"
			>
				{major.code}
			</span>
			<span
				class="border-2 border-on-background bg-secondary-fixed text-on-background px-3 py-1 font-bold font-data-mono neo-shadow-xs text-xs"
			>
				{major.totalStudents} Murid
			</span>
		</div>
	</div>
</div>
