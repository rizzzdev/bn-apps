<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_MASTER_API_URL } from '$env/static/public';
	import { getCookie, deleteCookie } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { Icon } from '$lib/components/atoms';

	let user = $derived($page.data.user);

	const handleLogout = async () => {
		try {
			const token = getCookie('access_token');
			await fetch(`${PUBLIC_MASTER_API_URL}/api/v1/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { 'Authorization': `Bearer ${token}` } : {})
				},
				credentials: 'include'
			});
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			deleteCookie('access_token');
			deleteCookie('refresh_token');
			toast.success('Berhasil keluar dari sistem');
			goto('/login');
		}
	};
</script>

<svelte:head>
	<title>403 - Akses Ditolak</title>
</svelte:head>

<div class="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
	<div class="max-w-md w-full bg-surface border-4 border-on-background shadow-neo p-8 flex flex-col items-center text-center gap-6">
		<div class="w-24 h-24 bg-error border-4 border-on-background rounded-full shadow-neo-sm flex items-center justify-center -mt-16 mb-2">
			<Icon name="block" class="text-5xl text-surface" />
		</div>
		
		<div class="flex flex-col gap-2">
			<h1 class="font-headline font-black text-4xl uppercase tracking-tight text-on-background">403</h1>
			<h2 class="font-headline font-bold text-xl uppercase tracking-tighter bg-error text-surface px-3 py-1 inline-block border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a] transform -rotate-2">
				Akses Ditolak!
			</h2>
			<p class="font-mono text-sm mt-4 text-on-background font-medium">
				Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali ke portal yang sesuai dengan peran Anda.
			</p>
		</div>

		<div class="w-full flex flex-col gap-3 mt-4">
			{#if user && user.roles}
				{#if user.roles.includes('super_admin')}
					<a href="/admin" class="w-full py-3 border-4 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
						<Icon name="dashboard" />
						Ke Portal Admin
					</a>
				{/if}
				{#if user.roles.includes('teacher')}
					<a href="/teacher" class="w-full py-3 border-4 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
						<Icon name="dashboard" />
						Ke Portal Guru
					</a>
				{/if}
				{#if user.roles.includes('student')}
					<a href="/student" class="w-full py-3 border-4 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
						<Icon name="dashboard" />
						Ke Portal Murid
					</a>
				{/if}
				{#if user.roles.includes('industry_mentor')}
					<a href="/mentor" class="w-full py-3 border-4 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
						<Icon name="dashboard" />
						Ke Portal Mentor
					</a>
				{/if}
			{:else}
				<a href="/" class="w-full py-3 border-4 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
					<Icon name="home" />
					Ke Halaman Utama
				</a>
			{/if}
			
			<button onclick={handleLogout} class="w-full mt-2 py-3 border-4 border-on-background bg-surface text-error font-bold uppercase tracking-widest hover:bg-error hover:text-surface transition-colors flex items-center justify-center gap-2 cursor-pointer">
				<Icon name="logout" />
				Keluar
			</button>
		</div>
	</div>
</div>
