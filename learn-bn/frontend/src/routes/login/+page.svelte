<script lang="ts">
	import { authState, getHomePath } from '$lib/features/auth/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Title from '$lib/components/Title.svelte';
	import Input from '$lib/components/Input.svelte';

	let identifier = $state('');
	let password = $state('');
	let errorMsg = $state('');
	let loading = $state(false);

	onMount(async () => {
		const currentUser = authState.user;
		if (currentUser) {
			goto(getHomePath(currentUser.role));
			return;
		}
		await authState.checkSession();
		const updatedUser = authState.user;
		if (updatedUser) {
			goto(getHomePath(updatedUser.role));
		}
	});

	async function handleLogin(e: Event) {
		e.preventDefault();
		errorMsg = '';
		loading = true;

		try {
			const user = await authState.login(identifier, password);
			goto(getHomePath(user.role));
		} catch (err: any) {
			errorMsg = err.message || 'Login gagal. Periksa identifier dan password Anda.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-background">
	<main class="w-full max-w-[480px] bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-8 md:p-12">
		<header class="text-center mb-stack-lg flex flex-col items-center gap-2">
			<Title class="justify-center mb-4" />
			<p class="font-body-md text-secondary mt-2">Masuk dengan kredensial Anda untuk melanjutkan ke dashboard.</p>
		</header>

		<form onsubmit={handleLogin} class="flex flex-col gap-6">
			{#if errorMsg}
				<div class="bg-error-container text-error p-4 neo-border font-label-bold text-sm">
					{errorMsg}
				</div>
			{/if}

			<Input 
				label="Identifier" 
				placeholder="Email, NIP, NIS, atau NISN" 
				bind:value={identifier} 
				icon="person" 
				required 
			/>
			
			<Input 
				label="Password" 
				type="password" 
				placeholder="Masukkan kata sandi" 
				bind:value={password} 
				icon="lock" 
				required 
			/>

			<div class="mt-4">
				<Button variant="primary" class="w-full h-12" type="submit" disabled={loading}>
					{loading ? 'Memproses...' : 'Masuk ke LMS'}
				</Button>
			</div>
		</form>

		<footer class="mt-stack-lg pt-stack-md border-t-2 border-on-surface flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
			<a class="font-label-bold text-label-bold text-on-surface hover:text-primary transition-colors hover:underline decoration-2 underline-offset-4" href="#!">Lupa Kata Sandi?</a>
			<span class="hidden sm:block text-secondary">|</span>
			<a class="font-label-bold text-label-bold text-on-surface hover:text-primary transition-colors hover:underline decoration-2 underline-offset-4" href="#!">Hubungi Admin</a>
		</footer>
	</main>
</div>
