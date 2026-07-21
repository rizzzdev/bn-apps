<script lang="ts">
	import { Card, DetailRow } from '$lib/components/molecules';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { Avatar } from '$lib/components/atoms';

	let {
		teacher
	} = $props<{
		teacher: {
			nip?: string | null;
			prefixTitle?: string | null;
			suffixTitle?: string | null;
			fullname: string;
			nik?: string | null;
			birthplace?: string | null;
			birthdate?: Date | string | null;
			gender: string;
			height?: number | null;
			weight?: number | null;
			religion?: string | null;
			ethnicGroup?: string | null;
			phoneNumber?: string | null;
			email?: string | null;
			status?: string | null;
			pictureId?: string | null;
			picture?: { url?: string; filename?: string } | null;
		};
	}>();

	const getInitials = () => {
		const words = (teacher.fullname || '').trim().split(/\s+/);
		if (words.length >= 2) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return (teacher.fullname || '?')[0].toUpperCase();
	};

	const getPictureSrc = () => {
		if (teacher.picture?.url) {
			return `${PUBLIC_API_URL}/attachments/file/${teacher.picture.url}`;
		}
		return null;
	};

	const formatFullName = () => {
		let name = teacher.fullname || '';
		if (teacher.prefixTitle) {
			name = `${teacher.prefixTitle.trim()} ${name.trim()}`;
		}
		if (teacher.suffixTitle) {
			name = `${name.trim()}, ${teacher.suffixTitle.trim()}`;
		}
		return name.trim();
	};

	const formatBirthdate = (date: Date | string | null | undefined) => {
		if (!date) return null;
		const d = new Date(date);
		const months = [
			'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
			'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
		];
		return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
	};
</script>

<div class="flex flex-col gap-md">
	<Card title="Informasi Personal">
		<div class="flex flex-col items-center gap-md">
			<!-- Avatar besar eye-catching di atas -->
			<div class="w-full flex justify-center">
				{#if getPictureSrc()}
					<Avatar
						src={getPictureSrc()!}
						alt={teacher.fullname}
						size="h-48 w-48 md:h-56 md:w-56"
						rounded="rounded-2xl"
						shadow="shadow-neo-lg"
					/>
				{:else}
					<div class="h-48 w-48 md:h-56 md:w-56 border-4 border-on-background rounded-2xl shadow-neo-lg flex items-center justify-center bg-linear-to-br from-secondary to-primary">
						<span class="text-5xl md:text-6xl font-headline-md text-on-secondary font-bold tracking-tighter">
							{getInitials()}
						</span>
					</div>
				{/if}
			</div>

			<!-- Detail rows -->
			<div class="w-full flex flex-col gap-sm mt-sm">
				<DetailRow label="Nama Lengkap" value={formatFullName()} />
				<DetailRow label="NIP" value={teacher.nip} />
				<DetailRow label="NIK" value={teacher.nik} />
				<DetailRow label="Tempat Lahir" value={teacher.birthplace} />
				<DetailRow label="Tanggal Lahir" value={formatBirthdate(teacher.birthdate)} />
				<DetailRow label="Jenis Kelamin" value={teacher.gender === 'L' ? 'Laki-Laki' : teacher.gender === 'P' ? 'Perempuan' : teacher.gender} />
				<DetailRow label="Agama" value={teacher.religion} />
				<DetailRow label="Suku Bangsa" value={teacher.ethnicGroup} />
				<DetailRow label="Status" value={teacher.status} />
			</div>
		</div>
	</Card>

	<div class="mt-md">
		<Card title="Data Fisik">
			<div class="flex flex-col gap-sm">
				<DetailRow label="Tinggi Badan" value={teacher.height ? `${teacher.height} cm` : null} />
				<DetailRow label="Berat Badan" value={teacher.weight ? `${teacher.weight} kg` : null} />
			</div>
		</Card>
	</div>

	<div class="mt-md">
		<Card title="Data Kontak">
			<div class="flex flex-col gap-sm">
				<DetailRow label="Nomor Telepon" value={teacher.phoneNumber} />
				<DetailRow label="Email" value={teacher.email} />
			</div>
		</Card>
	</div>
</div>
