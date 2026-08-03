<script lang="ts">
	import {
		Users,
		PlusCircle,
		ArrowRight,
		ArrowLeft,
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
		CalendarDays,
		CalendarCog,
		Save,
		Play,
		Sparkles,
		Ban,
		RefreshCw,
		Trash
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

	// mapping material symbols & custom names to lucide icons
	const iconMap: Record<string, any> = {
		groups: Users,
		group: Users,
		add_circle: PlusCircle,
		arrow_forward: ArrowRight,
		arrow_back: ArrowLeft,
		'arrow-left': ArrowLeft,
		arrow_left: ArrowLeft,
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
		save: Save,
		play: Play,
		sparkles: Sparkles,
		auto_awesome: Sparkles,
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
		calendar: Calendar,
		calendar_month: CalendarDays,
		calendar_cog: CalendarCog,
		check_circle: CheckCircle,
		'check-circle': CheckCircle,
		error: AlertCircle,
		info: Info,
		warning: TriangleAlert,
		'alert-triangle': TriangleAlert,
		checklist: SquareCheck,
		deselect: Square,
		refresh: RefreshCw,
		block: Ban,
		delete_sweep: Trash
	};

	const IconComponent = $derived(iconMap[name]);
</script>

{#if IconComponent}
	<IconComponent class={className} {size} strokeWidth={fill ? 3 : 2} />
{:else}
	<span class="text-error font-mono text-xs border border-error p-1">[{name}]</span>
{/if}
