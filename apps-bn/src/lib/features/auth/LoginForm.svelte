<script lang="ts">
	import Card from '$lib/components/molecules/Card.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Title from '$lib/components/atoms/Title.svelte';
	import { setCookie, getApiUrl } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		loading = true;

		try {
			const apiUrl = getApiUrl();
			const res = await fetch(`${apiUrl}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ identifier: email, password })
			});

			if (res.ok) {
				const data = await res.json();
				console.log('[Login] Success Response:', data);
				const accessToken = data.accessToken || data.access_token || data.data?.accessToken || data.data?.access_token;
				const refreshToken = data.refreshToken || data.refresh_token || data.data?.refreshToken || data.data?.refresh_token;

				// Cookie telah otomatis tersimpan oleh browser melalui header Set-Cookie dari api-bn (credentials: 'include')
				
				toast.success('Login berhasil! Mengalihkan...', 'Sukses');
				
				setTimeout(() => {
					window.location.href = '/';
				}, 600);
			} else {
				const errData = await res.json().catch(() => ({}));
				const msg = errData.message || 'Login gagal. Silakan periksa email dan password.';
				toast.error(msg, 'Gagal Login');
			}
		} catch (err) {
			console.error('Login error:', err);
			toast.error('Koneksi ke server gagal. Pastikan server backend sedang berjalan.', 'Kesalahan Sistem');
		} finally {
			loading = false;
		}
	};
</script>

<main class="relative z-10 w-full md:max-w-sm flex-1 md:flex-none flex flex-col items-center justify-center">
	<Card className="relative w-full flex-1 md:flex-none md:h-auto flex flex-col justify-center">
		<!-- Decorative Card Accents -->
		<div class="absolute -top-3 -right-3 w-6 h-6 bg-secondary-fixed border-[2px] border-black rounded-full neo-shadow-sm z-20 hidden sm:block"></div>
		<div class="absolute -bottom-3 -left-3 w-8 h-8 bg-primary-container border-[2px] border-black rounded-lg neo-shadow-sm z-20 transform rotate-12 hidden sm:block"></div>
		<div class="absolute top-0 left-0 w-full h-1.5 bg-primary-container rounded-t-xl border-b-[2px] border-black"></div>

		{#snippet header()}
			<Title size="lg" />
			<div class="mt-1.5">
				<p class="font-label-bold text-on-surface-variant tracking-wider bg-surface-container-highest inline-block px-2.5 py-0.5 border border-black rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase text-[10px]">
					Masukkan email dan password anda
				</p>
			</div>
		{/snippet}

		<form class="flex flex-col gap-4 mt-1" onsubmit={handleSubmit}>
			<Input
				label="Email"
				icon="mail"
				placeholder="Enter your email"
				bind:value={email}
				dotColor="bg-secondary-fixed"
			/>

			<Input
				label="Password"
				type="password"
				icon="key"
				placeholder="••••••••"
				bind:value={password}
				dotColor="bg-primary-container"
				allowTogglePassword={true}
			/>

			<Button type="submit" variant="primary" className="mt-2">
				{loading ? 'Logging in...' : 'Login'}
			</Button>
		</form>
	</Card>
</main>
