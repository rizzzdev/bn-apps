<script lang="ts">
	import {
		Users,
		PlusCircle,
		ArrowRight,
		Printer,
		Plus,
		GraduationCap,
		Award,
		History,
		Shield,
		User,
		Mail,
		Pen,
		Lock,
		Eye,
		EyeOff,
		LogIn,
		Clock,
		X,
		Menu,
		LogOut,
		ChevronUp,
		ChevronDown,
		Search,
		Check,
		Trash2,
		LayoutDashboard,
		UserCheck,
		BookOpen,
		UserCog,
		Calendar,
		CheckCircle,
		AlertCircle,
		Info,
		TriangleAlert,
		SquareCheck,
		Square,
		UserPlus,
		CalendarDays
	} from 'lucide-svelte';

	let {
		name,
		class: className = '',
		fill = false,
		size = '24px'
	} = $props<{
		name: string;
		class?: string;
		fill?: boolean;
		size?: string;
	}>();

	// mapping material symbols to lucide icons
	const iconMap: Record<string, any> = {
		groups: Users,
		group: Users,
		add_circle: PlusCircle,
		arrow_forward: ArrowRight,
		print: Printer,
		add: Plus,
		school: GraduationCap,
		people: Users,
		badge: Award,
		history: History,
		shield_person: Shield,
		person: User,
		person_add: UserPlus,
		user_plus: UserPlus,
		mail: Mail,
		edit: Pen,
		lock: Lock,
		visibility: Eye,
		visibility_off: EyeOff,
		login: LogIn,
		schedule: Clock,
		close: X,
		menu: Menu,
		logout: LogOut,
		expand_less: ChevronUp,
		expand_more: ChevronDown,
		search: Search,
		check: Check,
		delete: Trash2,
		dashboard: LayoutDashboard,
		supervisor_account: UserCheck,
		menu_book: BookOpen,
		admin_panel_settings: UserCog,
		calendar_today: Calendar,
		calendar_month: CalendarDays,
		check_circle: CheckCircle,
		error: AlertCircle,
		info: Info,
		warning: TriangleAlert,
		checklist: SquareCheck,
		deselect: Square
	};

	const IconComponent = $derived(iconMap[name]);
	// Convert "24px" to 24 for lucide, or leave as is if it accepts string
</script>

{#if IconComponent}
	<IconComponent class={className} {size} strokeWidth={fill ? 3 : 2} />
{:else}
	<span class="text-error font-mono text-xs border border-error p-1">[{name}]</span>
{/if}
