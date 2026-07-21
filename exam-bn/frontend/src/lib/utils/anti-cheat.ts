export type ViolationType =
	| 'TAB_SWITCH'
	| 'WINDOW_BLUR'
	| 'DEVTOOLS_OPEN'
	| 'PRINT_ATTEMPT'
	| 'SCREEN_CAPTURE'
	| 'SCREENSHOT_ATTEMPT'
	| 'CLIPBOARD_COPY'
	| 'FULLSCREEN_EXIT';

export interface AntiCheatOptions {
	onViolation: (reason: string, type: ViolationType) => void;
	/** whether the exam session is currently active (check before locking) */
	isActive: () => boolean;
}

/**
 * Attaches comprehensive anti-cheat listeners.
 * Returns a cleanup function — call it in onDestroy.
 */
export function startAntiCheat({ onViolation, isActive }: AntiCheatOptions): () => void {
	const fns: (() => void)[] = [];

	function lock(reason: string, type: ViolationType) {
		if (!isActive()) return;
		onViolation(reason, type);
	}

	// 1. Tab switch / minimize
	const onVisibilityChange = () => {
		if (document.visibilityState === 'hidden')
			lock('Berpindah tab atau minimize browser.', 'TAB_SWITCH');
	};

	// 2. Window blur (Alt+Tab, click outside browser, etc.)
	const onWindowBlur = () => lock('Fokus berpindah dari jendela ujian.', 'WINDOW_BLUR');

	// 3. Print (beforeprint event + Ctrl+P is blocked in keydown)
	const onBeforePrint = () => lock('Percobaan mencetak halaman ujian.', 'PRINT_ATTEMPT');

	// 4. Keyboard shortcuts
	const onKeydown = (e: KeyboardEvent) => {
		if (!isActive()) return;
		if (e.key === 'F12') {
			e.preventDefault();
			return;
		}
		if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) {
			e.preventDefault();
			return;
		}
		if (e.ctrlKey && ['u', 's'].includes(e.key.toLowerCase())) {
			e.preventDefault();
			return;
		}
		if (e.ctrlKey && e.key.toLowerCase() === 'p') {
			e.preventDefault();
			lock('Percobaan mencetak halaman ujian.', 'PRINT_ATTEMPT');
			return;
		}
		if (e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
			e.preventDefault();
			return;
		}
		if (e.key === 'PrintScreen') {
			e.preventDefault();
			lock('Percobaan screenshot terdeteksi.', 'SCREENSHOT_ATTEMPT');
			return;
		}
		if (e.altKey && e.key === 'Tab') {
			lock('Berpindah jendela dengan Alt+Tab.', 'TAB_SWITCH');
		}
		if (e.key === 'Meta') {
			e.preventDefault();
		}
	};

	// 5. Right-click
	const onContextmenu = (e: MouseEvent) => {
		if (isActive()) e.preventDefault();
	};

	// 6. Text selection prevention (allow textarea)
	const onSelectStart = (e: Event) => {
		if (isActive() && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault();
	};

	// 7. Copy event (catches any copy bypass)
	const onCopy = (e: ClipboardEvent) => {
		if (isActive()) e.preventDefault();
	};

	// 8. Drag prevention (prevents content extraction via drag)
	const onDragStart = (e: DragEvent) => {
		if (isActive()) e.preventDefault();
	};

	// 9. Screen capture / recording — intercept getDisplayMedia
	let restoreGetDisplayMedia: (() => void) | undefined;
	if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
		const original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
		navigator.mediaDevices.getDisplayMedia = async () => {
			lock('Percobaan perekaman layar terdeteksi.', 'SCREEN_CAPTURE');
			throw new DOMException('Screen capture blocked during exam', 'NotAllowedError');
		};
		restoreGetDisplayMedia = () => {
			if (navigator.mediaDevices) navigator.mediaDevices.getDisplayMedia = original;
		};
	}

	// 10. DevTools detection via window outer/inner size heuristic
	const DEVTOOLS_THRESHOLD = 160;
	const devtoolsInterval = setInterval(() => {
		if (!isActive()) return;
		const wDiff = window.outerWidth - window.innerWidth;
		const hDiff = window.outerHeight - window.innerHeight;
		if (wDiff > DEVTOOLS_THRESHOLD || hDiff > DEVTOOLS_THRESHOLD) {
			lock('DevTools terdeteksi terbuka.', 'DEVTOOLS_OPEN');
		}
	}, 3000);

	document.addEventListener('visibilitychange', onVisibilityChange);
	document.addEventListener('keydown', onKeydown);
	document.addEventListener('contextmenu', onContextmenu);
	document.addEventListener('selectstart', onSelectStart);
	document.addEventListener('copy', onCopy);
	document.addEventListener('dragstart', onDragStart);
	window.addEventListener('blur', onWindowBlur);
	window.addEventListener('beforeprint', onBeforePrint);

	fns.push(
		() => document.removeEventListener('visibilitychange', onVisibilityChange),
		() => document.removeEventListener('keydown', onKeydown),
		() => document.removeEventListener('contextmenu', onContextmenu),
		() => document.removeEventListener('selectstart', onSelectStart),
		() => document.removeEventListener('copy', onCopy),
		() => document.removeEventListener('dragstart', onDragStart),
		() => window.removeEventListener('blur', onWindowBlur),
		() => window.removeEventListener('beforeprint', onBeforePrint),
		() => clearInterval(devtoolsInterval)
	);
	if (restoreGetDisplayMedia) fns.push(restoreGetDisplayMedia);

	return () => fns.forEach((fn) => fn());
}
