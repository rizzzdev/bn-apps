<script lang="ts">
	import { page } from '$app/stores';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';
	import { StudentProfile } from '$lib/features/student';

	import { apiClient } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';

	let student = $state<import('$lib/types').Student | null>(null);
	let isLoading = $state(true);

	const fetchStudentDetail = async () => {
		isLoading = true;
		try {
			const res = await apiClient(
				`/students/${$page.params.id}?includePicture=true&includeCurrentClass=true&includeCurrentMajor=true`
			);
			const result = await res.json();

			if (!result.error && result.data) {
				student = result.data;
			} else {
				toast.error(result.message || 'Gagal memuat detail murid');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchStudentDetail();
	});
</script>

<svelte:head>
	<title>Master-BN - Detail Murid</title>
</svelte:head>

<PageHeader
	title="Detail Murid"
	description="Informasi lengkap mengenai profil, identitas, dan data fisik murid."
>
	{#snippet actions()}
		<Button variant="secondary" class="gap-xs" onclick={() => history.back()}>
			<Icon name="arrow_back" class="text-lg" fill={0} />
			Kembali
		</Button>
	{/snippet}
</PageHeader>

{#if isLoading}
	<div class="flex items-center justify-center p-xl">
		<span class="font-body-base text-on-surface-variant">Memuat data murid...</span>
	</div>
{:else if student}
	<StudentProfile student={student as import('$lib/types').Student} />
{:else}
	<div class="flex items-center justify-center p-xl">
		<span class="font-body-base text-error">Data murid tidak ditemukan.</span>
	</div>
{/if}
