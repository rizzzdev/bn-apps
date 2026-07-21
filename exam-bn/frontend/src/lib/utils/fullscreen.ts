export function requestFullscreen(): Promise<void> {
	const el = document.documentElement;
	if (el.requestFullscreen) return el.requestFullscreen();
	if ((el as any).webkitRequestFullscreen) return (el as any).webkitRequestFullscreen();
	return Promise.reject(new Error('Fullscreen not supported'));
}

export function exitFullscreen(): Promise<void> {
	if (document.exitFullscreen) return document.exitFullscreen();
	if ((document as any).webkitExitFullscreen) return (document as any).webkitExitFullscreen();
	return Promise.resolve();
}

export function isFullscreen(): boolean {
	return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
}
