<script lang="ts">
	import { page } from '$app/stores';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';
	import { TeacherProfile } from '$lib/features/teacher';
	import { apiClient } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';

	let teacher = $state<import('$lib/types').Teacher | null>(null);
	let isLoading = $state(true);

	const fetchTeacherDetail = async () => {
		isLoading = true;
		try {
			const res = await apiClient(`/teachers/${$page.params.id}?includePicture=true`);
			const result = await res.json();
			
			if (!result.error && result.data) {
				teacher = result.data;
			} else {
				toast.error(result.message || 'Gagal memuat detail guru');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchTeacherDetail();
	});
</script>

<svelte:head>
	<title>Master-BN - Detail Guru</title>
</svelte:head>

<PageHeader 
	title="Detail Guru" 
	description="Informasi lengkap mengenai profil, identitas, dan data fisik guru."
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
		<span class="font-body-base text-on-surface-variant">Memuat data guru...</span>
	</div>
{:else if teacher}
	<TeacherProfile teacher={teacher as any} />
{:else}
	<div class="flex items-center justify-center p-xl">
		<span class="font-body-base text-error">Data guru tidak ditemukan.</span>
	</div>
{/if}
