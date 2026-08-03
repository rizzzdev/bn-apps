<script lang="ts">
	import { StatCard } from '$lib/components/molecules';

	let {
		totalStudents = 0,
		activeStudents = 0,
		inactiveStudents = 0,
		graduatedStudents = 0
	} = $props<{
		totalStudents?: number;
		activeStudents?: number;
		inactiveStudents?: number;
		graduatedStudents?: number;
	}>();
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl">
	<StatCard title="Total Murid" value={totalStudents} icon="" bgIcon="group" />
	<StatCard title="Murid Aktif" value={activeStudents} icon="" bgIcon="check_circle" />
	<StatCard title="Murid Non-aktif" value={inactiveStudents} icon="" bgIcon="cancel" />
	<StatCard title="Murid Lulus" value={graduatedStudents} icon="" bgIcon="school" />
</div>
