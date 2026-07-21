<script lang="ts">
	import { Card, DetailRow } from '$lib/components/molecules';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { Avatar } from '$lib/components/atoms';

	let {
		student
	} = $props<{
		student: {
			fullname: string;
			nis?: string | null;
			nisn?: string | null;
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
		const words = (student.fullname || '').trim().split(/\s+/);
		if (words.length >= 2) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return (student.fullname || '?')[0].toUpperCase();
	};

	const getPictureSrc = () => {
		if (student.picture?.url) {
			return `${PUBLIC_API_URL}/attachments/file/${student.picture.url}`;
		}
		return null;
	};

	const formatFullName = () => {
		const parts = [];
		parts.push(student.fullname);
		return parts.join(' ');
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
						alt={student.fullname}
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
				<DetailRow label="NIS" value={student.nis} />
				<DetailRow label="NISN" value={student.nisn} />
				<DetailRow label="NIK" value={student.nik} />
				<DetailRow label="Tempat Lahir" value={student.birthplace} />
				<DetailRow label="Tanggal Lahir" value={formatBirthdate(student.birthdate)} />
				<DetailRow label="Jenis Kelamin" value={student.gender === 'L' ? 'Laki-Laki' : student.gender === 'P' ? 'Perempuan' : student.gender} />
				<DetailRow label="Agama" value={student.religion} />
				<DetailRow label="Suku Bangsa" value={student.ethnicGroup} />
				<DetailRow label="Status" value={student.status} />
			</div>
		</div>
	</Card>

	<Card title="Data Fisik">
		<div class="flex flex-col gap-sm">
			<DetailRow label="Tinggi Badan" value={student.height ? `${student.height} cm` : null} />
			<DetailRow label="Berat Badan" value={student.weight ? `${student.weight} kg` : null} />
		</div>
	</Card>

	<Card title="Data Kontak">
		<div class="flex flex-col gap-sm">
			<DetailRow label="Email" value={student.email} />
			<DetailRow label="Nomor Telepon" value={student.phoneNumber} />
		</div>
	</Card>
</div>
