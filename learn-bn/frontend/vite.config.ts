import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	server: {
		proxy: {
			'/api/v1/class': 'http://localhost:9061',
			'/api/v1/materials': 'http://localhost:9061',
			'/api/v1/assignments': 'http://localhost:9061',
			'/api/v1/assignment-submissions': 'http://localhost:9061',
			'/api/v1/quizzes': 'http://localhost:9061',
			'/api/v1/grades': 'http://localhost:9061',
			'/api/v1/lesson-schedule': 'http://localhost:9061',
			'/api/v1/attachments': 'http://localhost:9061',
			'/api/v1/student': 'http://localhost:9061',
			'/api/v1/teacher': 'http://localhost:9061',
			'/api/v1/subject': 'http://localhost:9061',
			'/api/v1/class-student': 'http://localhost:9061',
			'/api/v1/subject-teacher': 'http://localhost:9061',
			'/api/v1/dashboard': 'http://localhost:9061',
		}
	}
});
