<script lang="ts">
	import { Button, Icon, Title } from '$lib/components/atoms';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_MASTER_API_URL } from '$env/static/public';

	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);

	async function handleLogin() {
		if (!identifier || !password) {
			toast.error('Identifier dan password wajib diisi');
			return;
		}
		isLoading = true;
		try {
			const res = await fetch(`${PUBLIC_MASTER_API_URL}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ identifier, password })
			});
			const json = await res.json();
			if (!json.error) {
				toast.success(json.message);
				goto('/');
			} else {
				toast.error(json.message || 'Login gagal');
			}
		} catch {
			toast.error('Gagal terhubung ke server');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
	<div class="w-full max-w-md bg-surface neo-border neo-shadow">
		<div class="bg-primary text-on-primary p-8 neo-border-b">
			<Title />
		</div>

		<div class="p-8">
			<h2 class="font-headline-lg text-headline-lg font-bold text-on-background mb-2">Masuk</h2>
			<p class="font-body-md text-body-md text-on-surface-variant mb-8">
				Masukkan kredensial admin Anda.
			</p>

			<form onsubmit={handleLogin} class="flex flex-col gap-6">
				<div class="flex flex-col gap-2">
					<label
						for="identifier"
						class="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
					>
						Identifier
					</label>
					<div class="relative">
						<span class="absolute left-4 inset-y-0 flex items-center text-on-surface-variant">
							<Icon name="person" size="20px" />
						</span>
						<input
							id="identifier"
							type="text"
							bind:value={identifier}
							placeholder="Email atau username"
							class="w-full bg-surface-container-lowest neo-border pl-12 pr-4 py-3 font-data-mono text-data-mono text-on-background placeholder:text-outline-variant focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label
						for="password"
						class="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
					>
						Password
					</label>
					<div class="relative">
						<span class="absolute left-4 inset-y-0 flex items-center text-on-surface-variant">
							<Icon name="lock" size="20px" />
						</span>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="••••••••"
							class="w-full bg-surface-container-lowest neo-border pl-12 pr-12 py-3 font-data-mono text-data-mono text-on-background placeholder:text-outline-variant focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-4 inset-y-0 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer"
						>
							<Icon name={showPassword ? 'visibility_off' : 'visibility'} size="20px" />
						</button>
					</div>
				</div>

				<Button
					type="submit"
					variant="primary"
					disabled={isLoading}
					class="w-full flex items-center justify-center gap-2 mt-4"
				>
					{#if isLoading}
						<span>Memproses...</span>
					{:else}
						<Icon name="login" size="20px" /> Masuk
					{/if}
				</Button>
			</form>
		</div>
	</div>
</div>
