<script lang="ts">
	import { Icon, Button } from "$lib/components/atoms";
	import { PUBLIC_API_URL } from "$env/static/public";
	import { getAttachmentUrl } from "$lib/utils/helpers";
	import type { DailyLogbook } from "$lib/types";

	let {
		logbook,
		variant = "admin",
		onApprove,
		onRevision,
	}: {
		logbook: DailyLogbook;
		variant: "admin" | "teacher" | "mentor";
		onApprove?: (logbook: DailyLogbook) => void;
		onRevision?: (logbook: DailyLogbook) => void;
	} = $props();

	// Kondisi tombol aksi berdasarkan role
	let canAct = $derived(
		(variant === "teacher" && logbook.teacherStatus !== "approved") ||
			(variant === "mentor" && logbook.mentorStatus !== "approved"),
	);

	function formatDate(dateString: string | undefined) {
		if (!dateString) return "";
		const options: Intl.DateTimeFormatOptions = {
			day: "2-digit",
			month: "short",
			year: "numeric",
		};
		return new Date(dateString).toLocaleDateString("id-ID", options);
	}

	function getInitials(name: string | undefined) {
		if (!name) return "??";
		return name
			.split(" ")
			.map((n: string) => n[0])
			.join("")
			.substring(0, 2)
			.toUpperCase();
	}

	function getStatusClass(status: string) {
		if (status === "approved")
			return "bg-success text-on-background border-2 border-on-background";
		if (status === "rejected")
			return "bg-error text-white border-2 border-on-background";
		return "bg-secondary text-white border-2 border-secondary";
	}

	function getStatusLabel(status: string, rejected_label = "Ditolak") {
		if (status === "approved") return "Disetujui";
		if (status === "rejected") return rejected_label;
		return "Menunggu";
	}
</script>

<div
	class="border-2 border-on-background bg-surface shadow-neo-sm p-4 transition-all hover:translate-y-1 animate-fade-in-up"
>
	<!-- Student Header (teacher & mentor view) -->
	{#if variant !== "admin"}
		<div
			class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-dashed border-slate-200"
		>
			<div
				class="w-10 h-10 rounded-full border-2 border-on-background bg-primary flex items-center justify-center font-black font-headline text-sm shadow-[2px_2px_0px_0px_#0f172a]"
			>
				{getInitials(logbook.placement?.student?.name)}
			</div>
			<div>
				<h3 class="font-bold uppercase leading-none">
					{logbook.placement?.student?.name || "Siswa"}
				</h3>
				<span class="font-mono text-xs text-secondary mt-1 block"
					>Mitra: {logbook.placement?.company?.name || "-"}</span
				>
			</div>
		</div>
	{/if}

	<!-- Title & Status Badges -->
	<div
		class="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-{variant ===
		'admin'
			? '3'
			: '2'}"
	>
		<div class="flex-1">
			<h3 class="font-headline text-base font-black">
				{logbook.activityTitle}
			</h3>
			<div class="flex gap-2 mt-1.5 flex-wrap">
				<span
					class="text-[8px] px-1 py-0.5 font-bold font-mono uppercase {getStatusClass(
						logbook.mentorStatus,
					)}"
				>
					Mentor: {getStatusLabel(
						logbook.mentorStatus,
						variant === "admin" ? "Ditolak" : "Revisi",
					)}
				</span>
				<span
					class="text-[8px] px-1 py-0.5 font-bold font-mono uppercase {getStatusClass(
						logbook.teacherStatus,
					)}"
				>
					Guru: {getStatusLabel(
						logbook.teacherStatus,
						variant === "admin" ? "Ditolak" : "Revisi",
					)}
				</span>
			</div>
		</div>
		<!-- Date Badge -->
		<div
			class="w-fit inline-flex items-center gap-1.5 bg-primary border-2 border-on-background text-on-background px-1 py-0.5 mb-2 shadow-[1.5px_1.5px_0px_0px_#0f172a]"
		>
			<Icon name="calendar_today" class="text-xs" />
			<span
				class="font-mono text-[10px] font-black tracking-wider uppercase"
				>{formatDate(logbook.date)}</span
			>
		</div>

		<!-- Action Buttons (teacher & mentor) -->
		{#if variant !== "admin" && canAct && onApprove && onRevision}
			<div class="flex gap-2 shrink-0">
				<Button
					variant="warning"
					size="sm"
					onclick={() => onRevision!(logbook)}
				>
					<Icon name="rate_review" class="text-xs mr-1" /> Ajukan Revisi
				</Button>
				<Button
					variant="success"
					size="sm"
					onclick={() => onApprove!(logbook)}
				>
					<Icon name="check_circle" class="text-xs mr-1" /> Terima
				</Button>
			</div>
		{/if}
	</div>

	<!-- Placement Info Grid (admin only) -->
	{#if variant === "admin"}
		<div
			class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-2.5 bg-slate-50 border-2 border-on-background"
		>
			<div>
				<span
					class="text-[8px] font-mono uppercase tracking-wider font-bold text-secondary block"
					>Murid:</span
				>
				<span class="font-mono font-bold text-xs block"
					>{logbook.placement?.student?.name || "-"}</span
				>
			</div>
			<div>
				<span
					class="text-[8px] font-mono uppercase tracking-wider font-bold text-secondary block mb-0.5"
					>Industri:</span
				>
				<span class="font-mono font-bold text-xs block"
					>{logbook.placement?.company?.name || "-"}</span
				>
			</div>
			<div>
				<span
					class="text-[8px] font-mono uppercase tracking-wider font-bold text-secondary block mb-0.5"
					>Guru Pembimbing:</span
				>
				<span class="font-mono font-bold text-xs block"
					>{logbook.placement?.teacher?.name || "-"}</span
				>
			</div>
			<div>
				<span
					class="text-[8px] font-mono uppercase tracking-wider font-bold text-secondary block mb-0.5"
					>Mentor Industri:</span
				>
				<span class="font-mono font-bold text-xs block"
					>{logbook.placement?.industryMentor?.name || "-"}</span
				>
			</div>
		</div>
	{/if}

	<!-- Description -->
	<p class="text-xs text-on-surface whitespace-pre-wrap">
		{logbook.description}
	</p>

	<!-- Attachments -->
	{#if logbook.attachments && logbook.attachments.length > 0}
		<div
			class="mt-3 flex flex-col gap-1.5 pt-3 border-t-2 border-slate-200"
		>
			<span
				class="text-[10px] font-mono uppercase tracking-wider font-bold text-secondary"
				>Lampiran</span
			>
			<div class="flex flex-wrap gap-1.5">
				{#each logbook.attachments as att}
					<a
						href={getAttachmentUrl(att.url)}
						target="_blank"
						class="inline-flex items-center gap-1 bg-surface border-2 border-on-background px-1 py-0.5 text-[10px] font-bold font-mono hover:bg-slate-100"
					>
						<Icon name="attachment" class="text-[8px]" />
						<span class="truncate max-w-[150px]"
							>{att.filename}</span
						>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Review History (teacher & mentor) -->
	{#if variant !== "admin" && logbook.reviews && logbook.reviews.length > 0}
		<div
			class="mt-4 pt-4 border-t-2 border-on-background bg-slate-50 -mx-4 -mb-4 p-4"
		>
			<h4
				class="font-headline font-black text-sm uppercase mb-4 flex items-center gap-2"
			>
				<Icon name="history" class="text-[10px] text-secondary" /> Riwayat
				Review
			</h4>
			<div class="space-y-4">
				{#each logbook.reviews as review}
					<div class="flex gap-4">
						<div
							class="flex-1 bg-white border-2 border-on-background p-3 shadow-[2px_2px_0px_0px_#0f172a]"
						>
							<div class="flex justify-between items-start mb-1">
								<span
									class="font-bold text-xs font-mono uppercase"
								>
									{#if review.reviewerId === logbook.placement?.teacherId || review.reviewerId === logbook.placement?.teacher?.userId}
										Guru Pembimbing ({logbook.placement
											?.teacher?.name || "-"})
									{:else if review.reviewerId === logbook.placement?.industryMentorId || review.reviewerId === logbook.placement?.industryMentor?.userId}
										Mentor Industri ({logbook.placement
											?.industryMentor?.name || "-"})
									{:else}
										Reviewer
									{/if}
									- {review.action === "approved"
										? "Menerima Logbook"
										: "Mengajukan Revisi"}
								</span>
								<span
									class="text-[10px] text-secondary font-mono"
									>{formatDate(review.createdAt)}</span
								>
							</div>
							{#if review.content}
								<p
									class="text-sm mt-2 font-mono whitespace-pre-wrap"
								>
									{review.content}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
