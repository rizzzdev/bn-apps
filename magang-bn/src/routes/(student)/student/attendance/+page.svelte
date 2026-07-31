<script lang="ts">
	import { Icon, Button } from "$lib/components/atoms";
	import { Toast, ConfirmationModal, Modal } from "$lib/components/molecules";
	import { apiClient } from "$lib/utils/api";
	import { formatFullName, formatDateRange } from "$lib/utils/helpers";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let showConfirm = $state(false);
	let showToast = $state(false);
	let toastType = $state<"success" | "error">("success");
	let toastMessage = $state("");

	let isSubmitting = $state(false);
	let actionType = $state<"check_in" | "check_out">("check_in");

	let selectedPlacementId = $state<string>("");
	let showModal = $state(false);

	let locationReady = $state(false);
	let locationError = $state("");
	let currentLatitude = $state(0);
	let currentLongitude = $state(0);

	onMount(() => {
		if (typeof window !== "undefined" && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					currentLatitude = pos.coords.latitude;
					currentLongitude = pos.coords.longitude;
					locationReady = true;
				},
				(err) => {
					locationError =
						"Akses lokasi ditolak atau gagal. Harap izinkan akses lokasi (GPS) di browser Anda untuk melakukan absensi.";
					locationReady = false;
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
			);
		} else {
			locationError =
				"Fitur geolokasi tidak didukung oleh browser perangkat Anda.";
		}
	});

	let selectedPlacement = $derived(
		data.placements.find((p: any) => p.id === selectedPlacementId),
	);

	// Calculate attendance status for the selected placement today
	let todayCheckIn = $derived(
		data.todayAttendances.find(
			(a: any) =>
				a.placementId === selectedPlacementId && a.type === "check_in",
		),
	);
	let todayCheckOut = $derived(
		data.todayAttendances.find(
			(a: any) =>
				a.placementId === selectedPlacementId && a.type === "check_out",
		),
	);

	function openAttendanceModal(id: string) {
		selectedPlacementId = id;
		showModal = true;
	}

	function handleActionClick(type: "check_in" | "check_out") {
		actionType = type;
		showConfirm = true;
	}

	async function onConfirm() {
		if (
			!selectedPlacementId ||
			!data.profileData?.studentId ||
			!locationReady
		)
			return;

		isSubmitting = true;

		const now = new Date();

		const payload = {
			placementId: selectedPlacementId,
			studentId: data.profileData.studentId,
			type: actionType,
			date: now.toISOString(),
			time: now.toISOString(),
			locationMetadata: {
				latitude: currentLatitude,
				longitude: currentLongitude,
			},
		};

		const result = await apiClient("/attendances", {
			method: "POST",
			body: JSON.stringify(payload),
		});

		isSubmitting = false;

		if (result && !result.error) {
			toastType = "success";
			toastMessage = result.message || "Presensi berhasil dicatat!";
			showToast = true;
			showModal = false;
			// Reload slightly after toast to fetch new data
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} else {
			toastType = "error";
			toastMessage = result?.message || "Gagal mencatat presensi";
			showToast = true;
		}
	}

	function formatTime(isoString: string) {
		if (!isoString) return "";
		const date = new Date(isoString);
		return (
			date.toLocaleTimeString("id-ID", {
				hour: "2-digit",
				minute: "2-digit",
				timeZone: "UTC",
			}) + " WIB"
		);
	}

	// formatName diganti dengan formatFullName dari helpers


</script>

<svelte:head>
	<title>Presensi | Magang-BN</title>
</svelte:head>

<div
	class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up"
>
	<div>
		<h2 class="font-headline text-xl font-black uppercase tracking-tight">
			Presensi Harian
		</h2>
		<p class="font-mono text-secondary text-[10px] mt-1">
			Lakukan absensi masuk dan pulang berdasarkan lokasi GPS.
		</p>
	</div>
	<Button variant="warning" href="/student/attendance/recap">
		<Icon name="history" /> Rekap Presensi
	</Button>
</div>

{#if data.placements.length === 0}
	<div
		class="border-2 border-on-background bg-surface shadow-neo-sm p-5 text-center animate-fade-in-up relative z-20"
	>
		<Icon name="work_off" class="text-2xl text-secondary mb-3" />
		<h3 class="font-headline text-base font-black uppercase mb-1">
			Tidak Ada Magang Aktif
		</h3>
		<p class="font-mono text-secondary">
			Kamu belum memiliki penempatan magang yang aktif saat ini.
		</p>
	</div>
{:else}
	<div class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s;">
		<h3 class="font-headline text-sm font-black uppercase mb-3">
			Pilih Penempatan Magang
		</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each data.placements as placement}
				<button
					type="button"
					class="text-left flex flex-col justify-between border-2 border-on-background p-4 bg-surface transition-all hover:-translate-y-px hover:shadow-neo-sm"
					onclick={() => openAttendanceModal(placement.id)}
				>
					<div class="w-full">
						<div class="flex justify-between items-start mb-4">
							<h4
								class="font-headline font-black text-sm text-on-background"
							>
								{placement.company?.name || "Perusahaan"}
							</h4>
							<span
								class="bg-primary text-on-primary border border-on-background px-1 py-0.5 text-[8px] font-bold uppercase font-mono"
							>
								{placement.status === "active"
									? "Aktif"
									: "Selesai"}
							</span>
						</div>

						<div class="space-y-2 font-mono text-[10px] text-secondary">
							<div class="flex items-center gap-3">
								<div
									class="bg-on-background/5 p-2 rounded-full"
								>
									<Icon
										name="calendar_today"
										class="text-sm text-on-background"
									/>
								</div>
								<span
									>{formatDateRange(
										placement.startDate,
										placement.endDate,
									)}</span
								>
							</div>
							<div class="flex items-center gap-3">
								<div
									class="bg-on-background/5 p-2 rounded-full"
								>
									<Icon
										name="school"
										class="text-sm text-on-background"
									/>
								</div>
								<div class="flex flex-col">
									<span
										class="text-[10px] uppercase font-bold text-secondary"
										>Guru Pembimbing</span
									>
									<span class="text-on-background font-bold"
										>{formatFullName(
											placement.teacher,
										)}</span
									>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<div
									class="bg-on-background/5 p-2 rounded-full"
								>
									<Icon
										name="work"
										class="text-sm text-on-background"
									/>
								</div>
								<div class="flex flex-col">
									<span
										class="text-[10px] uppercase font-bold text-secondary"
										>Mentor Industri</span
									>
									<span class="text-on-background font-bold"
										>{formatFullName(
											placement.industryMentor,
										)}</span
									>
								</div>
							</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<Modal bind:show={showModal} title="Presensi Magang">
		<!-- Presensi Card -->
		<div class="flex flex-col items-center text-center">
			<div
				class="w-12 h-12 rounded-full border-2 border-on-background bg-slate-100 flex items-center justify-center mb-2 shadow-[2px_2px_0px_#0f172a]"
			>
				<Icon name="location_on" class="text-sm text-primary" />
			</div>
			<h3 class="font-headline font-black text-sm mb-1">Lokasi Anda</h3>
			<p
				class="font-mono text-xs mb-3 bg-slate-100 border-2 border-on-background px-2 py-0.5 font-bold"
			>
				{selectedPlacement?.company?.name || "-"}
			</p>

			{#if locationError}
				<div
					class="w-full p-2.5 border-2 border-on-background bg-error text-surface font-bold text-xs mb-3 text-left shadow-neo-sm"
				>
					<Icon
						name="location_off"
						class="mr-1.5 inline-block align-middle text-xs"
					/>
					<span class="align-middle">{locationError}</span>
				</div>
			{:else if !locationReady}
				<div
					class="w-full p-2.5 border-2 border-on-background bg-warning text-on-background font-bold text-xs mb-3 text-left shadow-neo-sm flex items-center"
				>
					<Icon
						name="gps_fixed"
						class="mr-1.5 inline-block text-xs animate-pulse"
					/>
					<span class="align-middle"
						>Mencari titik koordinat GPS Anda...</span
					>
				</div>
			{/if}

			{#if selectedPlacement?.status !== "active"}
				<div
					class="w-full p-2.5 border-2 border-on-background bg-slate-200 text-on-background font-black text-xs uppercase tracking-wider mb-2 flex justify-center items-center gap-2"
				>
					<Icon name="block" class="text-xs" />
					Magang Tidak Aktif
				</div>
				<p class="text-xs font-mono text-secondary">
				</p>
			{:else}
				<div class="flex flex-col gap-3 w-full">
					<div class="flex flex-col gap-1.5">
						<Button
							class="w-full text-xs py-2 flex-col gap-0.5"
							onclick={() => handleActionClick("check_in")}
							disabled={isSubmitting ||
								!locationReady ||
								!!todayCheckIn}
						>
							<div class="flex items-center gap-1.5">
								<Icon name="login" class="text-xs" />
								{isSubmitting && actionType === "check_in"
									? "Mencatat..."
									: "Absen Masuk"}
							</div>
							{#if todayCheckIn}
								<span
									class="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-1.5 py-0.5 border-2 border-on-background"
									>Sudah absen pukul {formatTime(
										todayCheckIn.time,
									)}</span
								>
							{/if}
						</Button>
					</div>

					<div class="flex flex-col gap-1.5">
						<Button
							variant="warning"
							class="w-full text-xs py-2 flex-col gap-0.5"
							onclick={() => handleActionClick("check_out")}
							disabled={isSubmitting ||
								!locationReady ||
								!!todayCheckOut}
						>
							<div class="flex items-center gap-1.5">
								<Icon name="logout" class="text-xs" />
								{isSubmitting && actionType === "check_out"
									? "Mencatat..."
									: "Absen Pulang"}
							</div>
							{#if todayCheckOut}
								<span
									class="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-1.5 py-0.5 border-2 border-on-background"
									>Sudah absen pukul {formatTime(
										todayCheckOut.time,
									)}</span
								>
							{/if}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</Modal>
{/if}

<ConfirmationModal
	bind:show={showConfirm}
	title="Konfirmasi Presensi"
	message={`Pastikan Anda sudah berada di lokasi Industri. Lakukan absen ${actionType === "check_in" ? "masuk" : "pulang"} sekarang?`}
	type="info"
	confirmText={`Ya, Absen ${actionType === "check_in" ? "Masuk" : "Pulang"}`}
	{onConfirm}
/>

<Toast bind:show={showToast} type={toastType} message={toastMessage} />
