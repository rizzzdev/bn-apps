<script lang="ts">
	import Banner from '$lib/components/molecules/Banner.svelte';
	import { resolveRoute } from '$app/paths';

	let { user = null }: { user?: { roles?: string[] | string } | null } = $props();

	let isSuperAdmin = $derived(
		user?.roles &&
			(Array.isArray(user.roles)
				? user.roles.includes('super_admin')
				: user.roles === 'super_admin')
	);
</script>

<Banner
	badgeText="SISTEM INFORMASI AKADEMIK TERPADU (SSO)"
	title="MODUL MANAJEMEN SEKOLAH"
	description="Akses layanan dan sistem akademik sekolah terpadu. Kelola data siswa, guru, kurikulum, dan operasional sekolah dengan efisien."
	icon="school"
	variant="primary"
>
	{#snippet actionButtons()}
		{#if isSuperAdmin}
			<a
				href={resolveRoute('/application')}
				class="group relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg border-2 border-black bg-tertiary-container px-3 py-1.5 font-label-bold text-xs tracking-wider text-on-tertiary uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:border-3 md:px-4 md:py-1.5 md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
			>
				<span class="relative z-10 inline-flex items-center gap-1.5">
					<span class="material-symbols-outlined text-sm md:text-base">apps</span>
					Manajemen Aplikasi
				</span>
				<div
					class="absolute inset-0 z-0 h-full w-0 bg-on-tertiary-fixed-variant transition-all duration-500 ease-out group-hover:w-full"
				></div>
			</a>

			<a
				href={resolveRoute('/role')}
				class="group relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg border-2 border-black bg-primary-container px-3 py-1.5 font-label-bold text-xs tracking-wider text-on-primary uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:border-3 md:px-4 md:py-1.5 md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
			>
				<span class="relative z-10 inline-flex items-center gap-1.5">
					<span class="material-symbols-outlined text-sm md:text-base">admin_panel_settings</span>
					Manajemen Role
				</span>
				<div
					class="absolute inset-0 z-0 h-full w-0 bg-on-primary-fixed-variant transition-all duration-500 ease-out group-hover:w-full"
				></div>
			</a>
		{/if}
	{/snippet}
</Banner>
