export function formatCountdown(diffMs: number): string {
	if (diffMs <= 0) return '00:00:00';
	const h = Math.floor(diffMs / 3_600_000);
	const m = Math.floor((diffMs % 3_600_000) / 60_000);
	const s = Math.floor((diffMs % 60_000) / 1_000);
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function createCountdown(
	getEndTime: () => Date | null,
	onTick: (display: string, expired: boolean) => void
): () => void {
	function tick() {
		const end = getEndTime();
		if (!end) {
			onTick('', false);
			return;
		}
		const diff = end.getTime() - Date.now();
		onTick(formatCountdown(diff), diff <= 0);
	}
	tick();
	const id = setInterval(tick, 1000);
	return () => clearInterval(id);
}
