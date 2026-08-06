<script lang="ts">
	import { Button, Icon, Title } from '$lib/components/atoms';
	import { PUBLIC_PORTAL_URL } from '$env/static/public';
	import { getApiBaseUrl } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';

	let isLoggingOut = $state(false);

	const portalUrl = (PUBLIC_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
	const portalLoginUrl = portalUrl.endsWith('/login') ? portalUrl : `${portalUrl}/login`;

	const handleLogout = async () => {
		isLoggingOut = true;
		try {
			await fetch(`${getApiBaseUrl()}/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});
			localStorage.removeItem('accessToken');
			toast.success('Berhasil logout');
			window.location.href = portalLoginUrl;
		} catch (error) {
			console.error('Logout error:', error);
			window.location.href = portalLoginUrl; // Force redirect even if error
		} finally {
			isLoggingOut = false;
		}
	};
</script>

<svelte:head>
	<title>403 Forbidden - Akses Ditolak</title>
</svelte:head>

<div
	class="flex min-h-dvh w-full flex-col items-center justify-center bg-[#FCD34D] p-md sm:p-lg md:p-xl"
>
	<div class="mb-lg rounded-xl border-3 border-on-background bg-surface px-lg py-sm shadow-neo-sm">
		<Title class="!text-3xl sm:!text-4xl" />
	</div>

	<div
		class="border-3 border-on-background shadow-neo bg-surface relative flex w-full max-w-[640px] flex-col items-center justify-center rounded-2xl p-lg sm:p-xl md:p-[64px] text-center transition-transform hover:-translate-y-1 hover:shadow-neo-lg"
	>
		<div class="relative mb-lg flex justify-center">
			<div
				class="absolute -right-8 -top-4 rounded-full bg-error px-md py-xs border-3 border-on-background shadow-neo-sm rotate-12 z-10"
			>
				<span
					class="font-body-bold text-on-error text-sm uppercase tracking-widest whitespace-nowrap"
					>Akses Ditolak</span
				>
			</div>
			<div
				class="text-[100px] md:text-[140px] leading-none font-display-lg font-black text-on-surface drop-shadow-[6px_6px_0_rgba(0,0,0,1)] tracking-tighter"
			>
				403
			</div>
		</div>

		<h1
			class="font-display-sm text-display-sm-mobile md:text-display-sm text-on-surface mb-md font-black uppercase tracking-tight"
		>
			Area Terlarang!
		</h1>

		<p class="font-body-bold text-body-bold text-on-surface mb-xl w-full max-w-[480px]">
			Waduh, sepertinya Anda tersesat. Halaman ini diproteksi secara ketat dan hanya dapat diakses
			oleh Administrator. Akun Anda saat ini tidak memiliki hak akses yang cukup.
		</p>

		<div class="flex w-full max-w-[280px] flex-col items-center gap-sm">
			<Button
				variant="secondary"
				class="!max-w-none w-full flex items-center justify-center gap-sm"
				href={portalUrl}
			>
				<Icon name="apps" class="text-lg" fill={0} />
				Kembali ke Portal
			</Button>
			<Button
				variant="error"
				class="!max-w-none w-full flex items-center justify-center gap-sm"
				onclick={handleLogout}
				disabled={isLoggingOut}
			>
				<Icon name="logout" class="text-lg" />
				{isLoggingOut ? 'Sedang keluar...' : 'Logout'}
			</Button>
		</div>
	</div>
</div>
