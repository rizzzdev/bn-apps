<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';

	let {
		show = $bindable(false),
		title = 'Input Nilai',
		score = $bindable(0),
		notes = $bindable(''),
		onsubmit = () => {},
	} = $props<{
		show?: boolean;
		title?: string;
		score?: number;
		notes?: string;
		onsubmit?: () => void;
	}>();

	let isSubmitting = $state(false);

	async function handleSubmit() {
		isSubmitting = true;
		try {
			await onsubmit();
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm">
		<div class="bg-surface border-4 border-on-background shadow-[8px_8px_0px_0px_#0f172a] w-full max-w-md animate-scale-in">
			<div class="border-b-4 border-on-background p-4 flex justify-between items-center bg-primary text-on-background">
				<h3 class="font-headline font-black text-xl uppercase">{title}</h3>
				<button onclick={() => show = false} class="hover:bg-on-background/20 p-1 rounded transition-colors">
					<Icon name="close" class="text-2xl" />
				</button>
			</div>
			<div class="p-6">
				<div class="mb-4">
					<label for="scoreInput" class="block font-bold text-sm uppercase mb-2">Skor Akhir (0-100)</label>
					<input id="scoreInput" type="number" bind:value={score} min="0" max="100" class="w-full border-4 border-on-background p-3 font-mono focus:outline-none focus:ring-4 focus:ring-primary/20 bg-slate-50 transition-all" />
				</div>
				<div class="mb-6">
					<label for="notesInput" class="block font-bold text-sm uppercase mb-2">Catatan Evaluasi</label>
					<textarea id="notesInput" bind:value={notes} rows="3" class="w-full border-4 border-on-background p-3 font-mono focus:outline-none focus:ring-4 focus:ring-primary/20 bg-slate-50 transition-all resize-none"></textarea>
				</div>
				<div class="flex gap-4">
					<Button variant="secondary" class="flex-1" onclick={() => show = false}>Batal</Button>
					<Button variant="primary" class="flex-1" onclick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
