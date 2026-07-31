<script lang="ts">
	import { onMount } from 'svelte';

	let { value = $bindable(''), placeholder = 'Tulis sesuatu...' }: { value?: string; placeholder?: string } = $props();

	let editorEl: HTMLDivElement;
	let editor: any = $state(null);

	let canUndo = $state(false);
	let canRedo = $state(false);

	function updateStates(e: any) {
		if (e) {
			canUndo = Boolean(e.can().chain().undo().run());
			canRedo = Boolean(e.can().chain().redo().run());
		}
	}

	onMount(async () => {
		const [
			Editor,
			StarterKit,
			Underline,
			Placeholder,
			Link,
			Table,
			TableRow,
			TableHeader,
			TableCell,
			TaskList,
			TaskItem,
			Markdown
		] = await Promise.all([
			import('@tiptap/core').then((m) => m.Editor),
			import('@tiptap/starter-kit').then((m) => m.default),
			import('@tiptap/extension-underline').then((m) => m.default),
			import('@tiptap/extension-placeholder').then((m) => m.default),
			import('@tiptap/extension-link').then((m: any) => m.default || m.Link),
			import('@tiptap/extension-table').then((m: any) => m.Table || m.default),
			import('@tiptap/extension-table-row').then((m: any) => m.TableRow || m.default),
			import('@tiptap/extension-table-header').then((m: any) => m.TableHeader || m.default),
			import('@tiptap/extension-table-cell').then((m: any) => m.TableCell || m.default),
			import('@tiptap/extension-task-list').then((m: any) => m.TaskList || m.default),
			import('@tiptap/extension-task-item').then((m: any) => m.TaskItem || m.default),
			import('tiptap-markdown').then((m) => m.Markdown),
		]);

		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({
					heading: { levels: [1, 2, 3] },
				}),
				Underline,
				Placeholder.configure({ placeholder }),
				Link.configure({ openOnClick: false }),
				Table.configure({ resizable: true }),
				TableRow,
				TableHeader,
				TableCell,
				TaskList,
				TaskItem.configure({ nested: true }),
				Markdown.configure({
					html: true,
					linkify: true,
				}),
			],
			content: value,
			onUpdate: ({ editor: e }: any) => {
				value = e.storage.markdown.getMarkdown();
				updateStates(e);
			},
			onTransaction: ({ editor: e }: any) => {
				updateStates(e);
			},
			onSelectionUpdate: ({ editor: e }: any) => {
				updateStates(e);
			},
		});
	});

	function runCmd(e: Event, cmd: () => void) {
		e.preventDefault();
		cmd();
		updateStates(editor);
	}
</script>

<div class="editor-wrapper neo-border bg-surface">
	<div class="toolbar flex flex-wrap items-center gap-1 p-2 border-b-2 border-on-surface bg-surface-container">
		<!-- Undo / Redo -->
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().undo().run())}
			disabled={!canUndo}
			class="toolbar-btn disabled:opacity-40"
			title="Urungkan (Undo)"
		>
			<span class="material-symbols-outlined text-sm">undo</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().redo().run())}
			disabled={!canRedo}
			class="toolbar-btn disabled:opacity-40"
			title="Ulangi (Redo)"
		>
			<span class="material-symbols-outlined text-sm">redo</span>
		</button>

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Text Formatting -->
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleBold().run())}
			class="toolbar-btn {editor?.isActive('bold') ? 'is-active' : ''}"
			title="Tebal (Bold)"
		>
			<span class="material-symbols-outlined text-sm">format_bold</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleItalic().run())}
			class="toolbar-btn {editor?.isActive('italic') ? 'is-active' : ''}"
			title="Miring (Italic)"
		>
			<span class="material-symbols-outlined text-sm">format_italic</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleUnderline().run())}
			class="toolbar-btn {editor?.isActive('underline') ? 'is-active' : ''}"
			title="Garis Bawah (Underline)"
		>
			<span class="material-symbols-outlined text-sm">format_underlined</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleStrike().run())}
			class="toolbar-btn {editor?.isActive('strike') ? 'is-active' : ''}"
			title="Coret Teks (Strikethrough)"
		>
			<span class="material-symbols-outlined text-sm">strikethrough_s</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleCode().run())}
			class="toolbar-btn {editor?.isActive('code') ? 'is-active' : ''}"
			title="Kode Inline"
		>
			<span class="material-symbols-outlined text-sm">code</span>
		</button>

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Headings -->
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().setParagraph().run())}
			class="toolbar-btn {editor?.isActive('paragraph') ? 'is-active' : ''}"
			title="Paragraf Biasa"
		>
			<span class="material-symbols-outlined text-sm">format_paragraph</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleHeading({ level: 1 }).run())}
			class="toolbar-btn {editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''}"
			title="Judul 1 (Heading 1)"
		>
			<span class="material-symbols-outlined text-sm">format_h1</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleHeading({ level: 2 }).run())}
			class="toolbar-btn {editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}"
			title="Judul 2 (Heading 2)"
		>
			<span class="material-symbols-outlined text-sm">format_h2</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleHeading({ level: 3 }).run())}
			class="toolbar-btn {editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}"
			title="Judul 3 (Heading 3)"
		>
			<span class="material-symbols-outlined text-sm">format_h3</span>
		</button>

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Lists -->
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleBulletList().run())}
			class="toolbar-btn {editor?.isActive('bulletList') ? 'is-active' : ''}"
			title="Daftar Simbol (Bullet List)"
		>
			<span class="material-symbols-outlined text-sm">format_list_bulleted</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleOrderedList().run())}
			class="toolbar-btn {editor?.isActive('orderedList') ? 'is-active' : ''}"
			title="Daftar Angka (Numbered List)"
		>
			<span class="material-symbols-outlined text-sm">format_list_numbered</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleTaskList().run())}
			class="toolbar-btn {editor?.isActive('taskList') ? 'is-active' : ''}"
			title="Daftar Tugas / Checklist (Task List)"
		>
			<span class="material-symbols-outlined text-sm">checklist</span>
		</button>

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Table Controls -->
		<button
			type="button"
			onclick={(e) =>
				runCmd(e, () =>
					editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
				)}
			class="toolbar-btn {editor?.isActive('table') ? 'is-active' : ''}"
			title="Buat Tabel (3x3)"
		>
			<span class="material-symbols-outlined text-sm">table</span>
		</button>
		{#if editor?.isActive('table')}
			<button
				type="button"
				onclick={(e) => runCmd(e, () => editor?.chain().focus().addColumnAfter().run())}
				class="toolbar-btn"
				title="Tambah Kolom"
			>
				<span class="material-symbols-outlined text-sm">view_column</span>
			</button>
			<button
				type="button"
				onclick={(e) => runCmd(e, () => editor?.chain().focus().addRowAfter().run())}
				class="toolbar-btn"
				title="Tambah Baris"
			>
				<span class="material-symbols-outlined text-sm">table_rows</span>
			</button>
			<button
				type="button"
				onclick={(e) => runCmd(e, () => editor?.chain().focus().deleteTable().run())}
				class="toolbar-btn text-error"
				title="Hapus Tabel"
			>
				<span class="material-symbols-outlined text-sm">delete</span>
			</button>
		{/if}

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Blocks & Extras -->
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleBlockquote().run())}
			class="toolbar-btn {editor?.isActive('blockquote') ? 'is-active' : ''}"
			title="Kutipan (Blockquote)"
		>
			<span class="material-symbols-outlined text-sm">format_quote</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().toggleCodeBlock().run())}
			class="toolbar-btn {editor?.isActive('codeBlock') ? 'is-active' : ''}"
			title="Blok Kode"
		>
			<span class="material-symbols-outlined text-sm">developer_mode</span>
		</button>
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().setHorizontalRule().run())}
			class="toolbar-btn"
			title="Garis Pemisah (Horizontal Rule)"
		>
			<span class="material-symbols-outlined text-sm">horizontal_rule</span>
		</button>

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Link -->
		<button
			type="button"
			onclick={(e) =>
				runCmd(e, () => {
					const url = window.prompt('Masukkan URL link:');
					if (url) {
						editor?.chain().focus().setLink({ href: url }).run();
					}
				})}
			class="toolbar-btn {editor?.isActive('link') ? 'is-active' : ''}"
			title="Sisipkan Link"
		>
			<span class="material-symbols-outlined text-sm">link</span>
		</button>
		{#if editor?.isActive('link')}
			<button
				type="button"
				onclick={(e) => runCmd(e, () => editor?.chain().focus().unsetLink().run())}
				class="toolbar-btn text-error"
				title="Hapus Link"
			>
				<span class="material-symbols-outlined text-sm">link_off</span>
			</button>
		{/if}

		<div class="h-5 w-[2px] bg-on-surface/30 mx-1 self-center"></div>

		<!-- Clear Formatting -->
		<button
			type="button"
			onclick={(e) => runCmd(e, () => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
			class="toolbar-btn"
			title="Hapus Format (Clear Formatting)"
		>
			<span class="material-symbols-outlined text-sm">format_clear</span>
		</button>
	</div>
	<div bind:this={editorEl} class="editor-content p-3 min-h-[200px] max-h-[400px] overflow-y-auto"></div>
</div>

<style lang="postcss">
	@reference "../../routes/layout.css";

	.editor-wrapper {
		@apply overflow-hidden;
	}
	.toolbar-btn {
		@apply p-1.5 min-w-[32px] h-[32px] inline-flex items-center justify-center font-label-bold border-2 border-on-surface bg-surface hover:bg-primary-container 
		       active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-75
		       shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)];
	}
	.toolbar-btn.is-active {
		@apply bg-primary-container shadow-none translate-x-[1px] translate-y-[1px];
	}
	.editor-content :global(.ProseMirror) {
		@apply outline-none min-h-[220px];
	}
	.editor-content :global(.ProseMirror p.is-editor-empty:first-child::before) {
		@apply text-secondary content-[attr(data-placeholder)] float-left h-0 pointer-events-none;
	}
	.editor-content :global(.ProseMirror h1) {
		@apply text-2xl font-bold mb-2 border-b border-on-surface/20 pb-1;
	}
	.editor-content :global(.ProseMirror h2) {
		@apply text-xl font-bold mb-2 border-b border-on-surface/10 pb-1;
	}
	.editor-content :global(.ProseMirror h3) {
		@apply text-lg font-bold mb-2;
	}
	.editor-content :global(.ProseMirror ul) {
		@apply list-disc pl-6 mb-2;
	}
	.editor-content :global(.ProseMirror ol) {
		@apply list-decimal pl-6 mb-2;
	}
	.editor-content :global(.ProseMirror blockquote) {
		@apply border-l-4 border-primary pl-4 italic my-2 text-secondary bg-surface-container/50 py-1;
	}
	.editor-content :global(.ProseMirror pre) {
		@apply bg-surface-container p-3 rounded border-2 border-on-surface font-mono text-sm overflow-x-auto my-2;
	}
	.editor-content :global(.ProseMirror code) {
		@apply bg-surface-container px-1.5 py-0.5 rounded text-sm font-mono border border-on-surface/30;
	}
	.editor-content :global(.ProseMirror hr) {
		@apply border-t-2 border-on-surface my-4;
	}
	.editor-content :global(.ProseMirror u) {
		@apply underline;
	}
	.editor-content :global(.ProseMirror s) {
		@apply line-through;
	}
	.editor-content :global(.ProseMirror a) {
		@apply text-primary underline hover:text-primary-container;
	}
	.editor-content :global(.ProseMirror p) {
		@apply mb-2;
	}
</style>

