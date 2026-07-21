<script lang="ts">
	import { FormField } from '$lib/components/molecules';
	import { Button } from '$lib/components/atoms';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { setCookie } from '$lib/utils/api';

	let identifier = $state('');
	let password = $state('');
	let isLoading = $state(false);

	const handleLogin = async (e: Event) => {
		e.preventDefault();
		isLoading = true;
		
		try {
			const res = await fetch(`${PUBLIC_API_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include', // <-- This allows cookies to be set
				body: JSON.stringify({ identifier, password })
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				toast.error(data.message || 'Gagal masuk');
				return;
			}

			toast.success(data.message || 'Berhasil masuk');
			
			// Save access token to cookie
			const newAccessToken = data.data?.accessToken || data.accessToken;
			if (newAccessToken) {
				setCookie('access_token', newAccessToken, 900); // 15 mins
			}

			// Force full page reload to ensure hooks.server.ts intercepts and validates the new session cookies
			window.location.href = '/';
		} catch (error) {
			console.error('Login error:', error);
			toast.error('Terjadi kesalahan saat masuk');
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="flex flex-col gap-md w-full">
	<div class="mb-sm">
		<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">Selamat Datang Kembali</h1>
		<p class="font-body-base text-body-base text-on-surface-variant">Silakan masukkan informasi kredensial untuk mengakses akun Anda.</p>
	</div>

	<form onsubmit={handleLogin} class="flex flex-col gap-sm w-full">
		<FormField
			id="identifier"
			label="Alamat Email / Nomor Identitas"
			type="text"
			placeholder="Masukkan email, NIP, atau NIS"
			bind:value={identifier}
			required
		/>

		<FormField
			id="password"
			label="Kata Sandi"
			type="password"
			placeholder="Masukkan kata sandi"
			bind:value={password}
			required
		/>

		<Button type="submit" variant="action" class="mt-sm w-full" disabled={isLoading}>
			{isLoading ? 'Sedang masuk...' : 'Masuk'}
		</Button>
	</form>
</div>
