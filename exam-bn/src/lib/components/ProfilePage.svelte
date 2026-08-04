<script lang="ts">
	import { getInitials, resolvePictureUrl } from '$lib/utils/avatar';

	let { data }: { data: any } = $props();

	let imageError = $state(false);

	const roleLabel: Record<string, string> = {
		super_admin: 'Admin',
		teacher: 'Pengawas',
		student: 'Peserta'
	};

	const fullname = $derived(data.profileUser?.fullname?.trim() || 'Super Admin');
	const initial = $derived(getInitials(fullname));
	const pictureUrl = $derived(resolvePictureUrl(data.profileUser?.pictureUrl));
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Profil Saya</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">
		Data akun dikelola di aplikasi master/portal.
	</p>
</div>

<div class="max-w-2xl space-y-6">
	<!-- Info Profil -->
	<div class="card p-6">
		<div class="flex items-center gap-4 mb-6 pb-6 border-b-2 border-(--nb-border)">
			{#if pictureUrl && !imageError}
				<img
					src={pictureUrl}
					alt={fullname}
					onerror={() => (imageError = true)}
					class="w-16 h-16 rounded-full object-cover border-2 border-(--nb-border)"
				/>
			{:else}
				<div
					class="avatar-pill w-16 h-16 flex items-center justify-center font-black text-xl text-white rounded-full"
				>
					{initial}
				</div>
			{/if}
			<div>
				<h2 class="text-xl font-black text-(--text-primary)">{fullname}</h2>
				<p class="text-xs font-bold uppercase tracking-wider text-primary-500 mt-0.5">
					{roleLabel[data.profileUser?.role] ?? data.profileUser?.role ?? '-'}
				</p>
			</div>
		</div>


		<dl class="space-y-4">
			<div>
				<dt class="text-xs font-black uppercase tracking-wide text-(--text-secondary)">Nama Lengkap</dt>
				<dd class="font-black text-(--text-primary) mt-1">
					{fullname}
				</dd>
			</div>
			<div>
				<dt class="text-xs font-black uppercase tracking-wide text-(--text-secondary)">Email</dt>
				<dd class="font-medium text-(--text-primary) mt-1 break-all">
					{data.profileUser?.email || '—'}
				</dd>
			</div>
			<div>
				<dt class="text-xs font-black uppercase tracking-wide text-(--text-secondary)">Role</dt>
				<dd class="font-black text-primary-500 mt-1">
					{roleLabel[data.profileUser?.role] ?? data.profileUser?.role ?? '-'}
				</dd>
			</div>
		</dl>
	</div>
</div>

