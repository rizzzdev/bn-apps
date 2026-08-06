<script lang="ts">
	import Card from '$lib/components/molecules/Card.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Title from '$lib/components/atoms/Title.svelte';
	import { getApiUrl } from '$lib/utils/api';
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
			toast.error(
				'Koneksi ke server gagal. Pastikan server backend sedang berjalan.',
				'Kesalahan Sistem'
			);
		} finally {
			loading = false;
		}
	};
</script>

<main
	class="relative z-10 flex w-full flex-1 flex-col items-center justify-center md:max-w-sm md:flex-none"
>
	<Card className="relative w-full flex-1 md:flex-none md:h-auto flex flex-col justify-center">
		<!-- Decorative Card Accents -->
		<div
			class="neo-shadow-sm absolute -top-3 -right-3 z-20 hidden h-6 w-6 rounded-full border-[2px] border-black bg-secondary-fixed sm:block"
		></div>
		<div
			class="neo-shadow-sm absolute -bottom-3 -left-3 z-20 hidden h-8 w-8 rotate-12 transform rounded-lg border-[2px] border-black bg-primary-container sm:block"
		></div>
		<div
			class="absolute top-0 left-0 h-1.5 w-full rounded-t-xl border-b-[2px] border-black bg-primary-container"
		></div>

		{#snippet header()}
			<Title size="lg" />
			<div class="mt-1.5">
				<p
					class="inline-block rounded border border-black bg-surface-container-highest px-2.5 py-0.5 font-label-bold text-[10px] tracking-wider text-on-surface-variant uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
				>
					Masukkan email dan password anda
				</p>
			</div>
		{/snippet}

		<form class="mt-1 flex flex-col gap-4" onsubmit={handleSubmit}>
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
