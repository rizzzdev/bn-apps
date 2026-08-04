<script lang="ts">
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/stores/toast';
	import AppLogo from '$lib/components/ui/AppLogo.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Login - Exam-BN</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 bg-(--bg-primary)">
	<div class="max-w-md w-full space-y-0">
		<!-- Header block -->
		<div class="login-panel-header p-6 text-center">
			<div class="flex justify-center mb-3">
				<AppLogo size={56} showText={false} />
			</div>
			<h1 class="text-3xl font-black text-white tracking-tight">Exam-BN</h1>
			<p class="mt-1 text-sm font-bold text-white/80">Platform Ujian Modern & Aman</p>
		</div>

		<!-- Form block -->
		<div class="login-panel-body p-8">
			<h2 class="text-xl font-black text-(--text-primary) mb-6">Masuk ke Akun Anda</h2>

			<form
				class="space-y-4"
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update, result }) => {
						if (result.type === 'failure') {
							loading = false;
							addToast((result.data as any)?.error ?? 'Username atau password salah.', 'error');
						} else if (result.type === 'error') {
							loading = false;
							addToast('Terjadi kesalahan. Coba lagi.', 'error');
						} else {
							await update();
						}
					};
				}}
			>
				<div>
					<label for="username" class="block text-sm font-black text-(--text-primary) mb-1"
						>Username</label
					>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						required
						placeholder="Masukkan username"
						disabled={loading}
						class="input-field"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-black text-(--text-primary) mb-1"
						>Password</label
					>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						placeholder="Masukkan password"
						disabled={loading}
						class="input-field"
					/>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<input
						id="remember-me"
						name="remember-me"
						type="checkbox"
						class="w-4 h-4 cursor-pointer accent-primary-500"
					/>
					<label for="remember-me" class="text-sm font-bold text-(--text-secondary) cursor-pointer">
						Ingat saya
					</label>
				</div>

				<div class="pt-2">
					<button
						type="submit"
						class="btn-primary w-full py-3 text-base relative"
						disabled={loading}
					>
						{#if loading}
							<svg
								class="animate-spin h-5 w-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<span class="opacity-0">Masuk</span>
						{:else}
							Masuk
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
