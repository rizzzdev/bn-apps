<script lang="ts">
	import { page } from '$app/stores';
	import { logout } from '$lib/utils/api';
	import { Icon } from '$lib/components/atoms';

	let user = $derived($page.data?.user);
	let status = $derived($page.status);
	let message = $derived($page.error?.message || 'Halaman tidak ditemukan');
</script>

<svelte:head>
	<title>{status} - {message}</title>
</svelte:head>

<div class="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
	<div class="max-w-sm w-full bg-surface border-2 border-on-background shadow-neo-sm p-5 flex flex-col items-center text-center gap-4">
		<div class="w-16 h-16 bg-error border-2 border-on-background rounded-full shadow-neo-sm flex items-center justify-center -mt-10 mb-1">
			<Icon name="search_off" class="text-lg text-surface" />
		</div>
		
		<div class="flex flex-col gap-2">
			<h1 class="font-headline font-black text-base uppercase tracking-tight text-on-background">{status}</h1>
			<h2 class="font-headline font-bold text-sm uppercase tracking-tighter bg-error text-surface px-2 py-0.5 inline-block border border-on-background shadow-[1px_1px_0px_0px_#0f172a] transform -rotate-2">
				HALAMAN TIDAK DITEMUKAN
			</h2>
			<p class="font-mono text-[10px] mt-3 text-on-background font-medium">
				{message === 'Not Found' ? 'Halaman yang Anda cari tidak dapat ditemukan.' : message} Silakan kembali ke portal yang sesuai dengan peran Anda.
			</p>
		</div>

		<div class="w-full flex flex-col gap-2 mt-3">
			{#if user && user.roles}
				{#if user.roles.includes('super_admin')}
					<a href="/admin" class="w-full py-2 border-2 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center justify-center gap-1">
						<Icon name="dashboard" class="text-[10px]" />
						Ke Portal Admin
					</a>
				{/if}
				{#if user.roles.includes('teacher')}
					<a href="/teacher" class="w-full py-2 border-2 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center justify-center gap-1">
						<Icon name="dashboard" class="text-[10px]" />
						Ke Portal Guru
					</a>
				{/if}
				{#if user.roles.includes('student')}
					<a href="/student" class="w-full py-2 border-2 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center justify-center gap-1">
						<Icon name="dashboard" class="text-[10px]" />
						Ke Portal Murid
					</a>
				{/if}
				{#if user.roles.includes('industry_mentor')}
					<a href="/mentor" class="w-full py-2 border-2 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center justify-center gap-1">
						<Icon name="dashboard" class="text-[10px]" />
						Ke Portal Mentor
					</a>
				{/if}
			{:else}
				<a href="/" class="w-full py-2 border-2 border-on-background bg-secondary text-surface font-bold uppercase tracking-widest shadow-neo-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center justify-center gap-1">
					<Icon name="home" class="text-[10px]" />
					Ke Halaman Utama
				</a>
			{/if}
			
			<button onclick={logout} class="w-full mt-1 py-2 border-2 border-on-background bg-surface text-error font-bold uppercase tracking-widest hover:bg-error hover:text-surface transition-colors flex items-center justify-center gap-1 cursor-pointer">
				<Icon name="logout" class="text-[10px]" />
				Keluar
			</button>
		</div>
	</div>
</div>
