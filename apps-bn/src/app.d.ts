// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				identifier: string;
				roles: string[];
				[key: string]: unknown;
			};
		}
		interface PageData {
			user?: {
				id: string;
				identifier: string;
				roles: string[];
				[key: string]: unknown;
			};
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
