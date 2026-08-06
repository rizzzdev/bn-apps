<script lang="ts">
	import { AlumniHistoryPage } from '$lib/components/templates';
	import { majorApi, studentApi, academicYearApi } from '$lib/services';
	import { page } from '$app/stores';

	let id = $derived($page.params.id ?? '');
</script>

<AlumniHistoryPage
	entityId={id}
	titlePrefix="Jurusan"
	backHref={`/major-students/${id}`}
	backLabel="Kembali ke Detail Jurusan"
	warningStatuses={['Pindah']}
	mappingKey="majorId"
	fetchDetail={async () => (await majorApi.getById(id)).data ?? null}
	fetchMappings={async () => (await majorApi.majorStudents.list(1, 1000)).data ?? []}
	fetchStudents={async () => (await studentApi.list(1, 1000)).data ?? []}
	fetchAcademicYears={async () => (await academicYearApi.list(1, 100)).data ?? []}
/>
