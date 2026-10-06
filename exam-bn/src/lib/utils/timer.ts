export function formatCountdown(diffMs: number): string {
	if (diffMs <= 0) return '00:00:00';
	const hours = Math.floor(diffMs / 3_600_000);
	const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
	const seconds = Math.floor((diffMs % 60_000) / 1_000);
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
