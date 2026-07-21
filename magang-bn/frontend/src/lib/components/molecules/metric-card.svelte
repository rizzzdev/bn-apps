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

<div class="border-4 border-on-background {bgColors[variant as Variant]} shadow-neo p-4 flex items-center justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#0f172a] transition-all">
	<div class="flex flex-col">
		<span class="font-mono text-sm font-bold uppercase opacity-90">{title}</span>
		<span class="font-headline text-4xl font-black">{value}</span>
	</div>
	<div class="w-12 h-12 rounded-full border-4 border-on-background bg-surface text-on-background flex items-center justify-center">
		<Icon name={icon} class="text-2xl" />
	</div>
</div>
