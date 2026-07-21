<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { addToast } from '$lib/stores/toast';

	let { data }: { data: any; form?: any } = $props();

	let profileLoading = $state(false);
	let passwordLoading = $state(false);

	let fullname = $state('');
	let username = $state('');

	const roleLabel: Record<string, string> = {
		ADMIN: 'Admin',
		SUPERVISOR: 'Pengawas',
		PARTICIPANT: 'Peserta'
	};

	$effect(() => {
		if (data.profileUser) {
			fullname = data.profileUser.fullname ?? '';
			username = data.profileUser.username ?? '';
		}
	});
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Profil Saya</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">Kelola informasi akun Anda.</p>
</div>

<div class="max-w-2xl space-y-6">
	<!-- Info Profil -->
	<div class="card p-6">
		<h2
			class="text-base font-black text-(--text-primary) mb-4 pb-3 border-b-2 border-(--nb-border)"
		>
			Informasi Profil
		</h2>
		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				profileLoading = true;
				return async ({ update, result }) => {
					profileLoading = false;
					if (result.type === 'success')
						addToast((result.data as any)?.message ?? 'Profil berhasil diperbarui.', 'success');
					else if (result.type === 'failure')
						addToast((result.data as any)?.error ?? 'Terjadi kesalahan.', 'error');
					await update({ reset: false });
				};
			}}
			class="space-y-4"
		>
			<Input id="fullname" name="fullname" label="Nama Lengkap" required bind:value={fullname} />
			<Input id="username" name="username" label="Username" required bind:value={username} />
			<div class="flex items-center gap-4 pt-1">
				<Button type="submit" loading={profileLoading}>
					{profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
				</Button>
				<div class="text-xs font-bold text-(--text-secondary)">
					Role: <span class="font-black text-primary-500">
						{roleLabel[data.profileUser?.role] ?? data.profileUser?.role ?? '-'}
					</span>
				</div>
			</div>
		</form>
	</div>

	<!-- Ubah Password -->
	<div class="card p-6">
		<h2
			class="text-base font-black text-(--text-primary) mb-4 pb-3 border-b-2 border-(--nb-border)"
		>
			Ubah Password
		</h2>
		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				passwordLoading = true;
				return async ({ update, result }) => {
					passwordLoading = false;
					if (result.type === 'success')
						addToast((result.data as any)?.message ?? 'Password berhasil diubah.', 'success');
					else if (result.type === 'failure')
						addToast((result.data as any)?.error ?? 'Terjadi kesalahan.', 'error');
					await update();
				};
			}}
			class="space-y-4"
		>
			<Input
				id="oldPassword"
				name="oldPassword"
				type="password"
				label="Password Lama"
				placeholder="Masukkan password lama"
				required
			/>
			<Input
				id="newPassword"
				name="newPassword"
				type="password"
				label="Password Baru"
				placeholder="Minimal 6 karakter"
				required
			/>
			<Input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				label="Konfirmasi Password Baru"
				placeholder="Ulangi password baru"
				required
			/>
			<Button type="submit" loading={passwordLoading}>
				{passwordLoading ? 'Menyimpan...' : 'Ubah Password'}
			</Button>
		</form>
	</div>
</div>
