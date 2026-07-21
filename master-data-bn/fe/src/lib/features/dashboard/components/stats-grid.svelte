<script lang="ts">
	import { StatCard } from '$lib/components/molecules';
	import { apiClient } from '$lib/utils/api';
	import { onMount } from 'svelte';

	let stats = $state([
		{
			id: 'students',
			icon: 'group',
			title: 'Total Murid Aktif',
			value: '...',
			badgeText: 'Tervalidasi',
			badgeColor: '#A3E635' // Lime
		},
		{
			id: 'teachers',
			icon: 'record_voice_over',
			title: 'Total Guru Aktif',
			value: '...',
			badgeText: 'Siap Mengajar',
			badgeColor: '#34D399' // Emerald
		},
		{
			id: 'majors',
			icon: 'school',
			title: 'Total Jurusan Aktif',
			value: '...',
			badgeText: 'Program Keahlian',
			badgeColor: '#FEF08A' // Yellow
		},
		{
			id: 'classes',
			icon: 'meeting_room',
			title: 'Total Kelas Aktif',
			value: '...',
			badgeText: 'Digunakan',
			badgeColor: '#60A5FA' // Blue
		},
		{
			id: 'academic_year',
			icon: 'calendar_today',
			title: 'Tahun Pelajaran Aktif',
			value: '...',
			badgeText: '...',
			badgeColor: '#F472B6' // Pink
		},
		{
			id: 'subjects',
			icon: 'menu_book',
			title: 'Total Mata Pelajaran',
			value: '...',
			badgeText: 'Terdaftar',
			badgeColor: '#FCD34D' // Yellow
		}
	]);

	onMount(async () => {
		try {
			const res = await apiClient('/dashboard/summary');
			if (res.ok) {
				const data = await res.json();
				const summary = data.data || data; // handle if data is wrapped in data object
				
				stats = stats.map(s => {
					if (s.id === 'students') return { ...s, value: summary.totalStudents?.toString() || '0' };
					if (s.id === 'teachers') return { ...s, value: summary.totalTeachers?.toString() || '0' };
					if (s.id === 'majors') return { ...s, value: summary.totalMajors?.toString() || '0' };
					if (s.id === 'classes') return { ...s, value: summary.totalClasses?.toString() || '0' };
					if (s.id === 'subjects') return { ...s, value: summary.totalSubjects?.toString() || '0' };
					if (s.id === 'academic_year') return { 
						...s, 
						value: summary.activeAcademicYear || 'Belum Diatur',
						badgeText: `Semester ${summary.activeSemester || 'Belum Diatur'}`
					};
					return s;
				});
			}
		} catch (error) {
			console.error('Failed to fetch dashboard summary:', error);
		}
	});
</script>

<section class="gap-md md:gap-lg lg:gap-xl xl:gap-xl mb-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
	{#each stats as { id, ...stat }}
		<StatCard {...stat} />
	{/each}
</section>
