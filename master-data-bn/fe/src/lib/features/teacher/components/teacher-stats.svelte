<script lang="ts">
	import { StatCard } from '$lib/components/molecules';

	let {
		totalTeachers = 0,
		activeTeachers = 0,
		inactiveTeachers = 0,
		retiredTeachers = 0
	} = $props<{
		totalTeachers?: number;
		activeTeachers?: number;
		inactiveTeachers?: number;
		retiredTeachers?: number;
	}>();
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl">
	<StatCard
		title="Total Guru"
		value={totalTeachers}
		icon=""
		bgIcon="group"
		class="h-32"
	/>
	<StatCard
		title="Guru Aktif"
		value={activeTeachers}
		icon=""
		bgIcon="check_circle"
		class="h-32"
	/>
	<StatCard
		title="Guru Non-aktif"
		value={inactiveTeachers}
		icon=""
		bgIcon="cancel"
		class="h-32"
	/>
	<StatCard
		title="Guru Pensiun"
		value={retiredTeachers}
		icon=""
		bgIcon="elderly"
		class="h-32"
	/>
</div>
