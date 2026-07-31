<script lang="ts">
	import { Icon } from '../atoms';
	type Variant = 'primary' | 'warning' | 'error' | 'success' | 'surface';
	let { title, value, icon, variant = 'primary' } = $props<{ title: string, value: string | number, icon: string, variant?: Variant }>();
	
	const bgColors: Record<Variant, string> = {
		primary: 'bg-primary text-on-background',
		warning: 'bg-[#facc15] text-on-background',
		error: 'bg-error text-surface',
		success: 'bg-[#4ade80] text-on-background',
		surface: 'bg-surface text-on-background'
	};
</script>

<div class="border-2 border-on-background {bgColors[variant as Variant]} shadow-neo-sm p-3 flex items-center justify-between hover:-translate-y-px hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all">
	<div class="flex flex-col">
		<span class="font-mono text-[10px] font-bold uppercase tracking-wider opacity-90">{title}</span>
		<span class="font-headline text-base md:text-lg font-black mt-0.5">{value}</span>
	</div>
	<div class="w-7 h-7 rounded-full border-2 border-on-background bg-surface text-on-background flex items-center justify-center shrink-0">
		<Icon name={icon} class="text-xs" />
	</div>
</div>
