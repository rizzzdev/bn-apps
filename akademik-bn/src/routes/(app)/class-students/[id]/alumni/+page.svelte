<script lang="ts">
	import { AlumniHistoryPage } from '$lib/components/templates';
	import { classApi, studentApi, academicYearApi } from '$lib/services';
	import { page } from '$app/stores';

	let id = $derived($page.params.id ?? '');
</script>

<AlumniHistoryPage
	entityId={id}
	titlePrefix="Kelas"
	backHref={`/class-students/${id}`}
	backLabel="Kembali ke Detail Kelas"
	warningStatuses={['Pindah', 'Naik Kelas', 'Tinggal Kelas']}
	mappingKey="classId"
	fetchDetail={async () => (await classApi.getById(id)).data ?? null}
	fetchMappings={async () => (await classApi.classStudents.list(1, 1000)).data ?? []}
	fetchStudents={async () => (await studentApi.list(1, 1000)).data ?? []}
	fetchAcademicYears={async () => (await academicYearApi.list(1, 100)).data ?? []}
/>
