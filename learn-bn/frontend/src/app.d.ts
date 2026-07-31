declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				name: string;
				role: 'teacher' | 'student' | 'super_admin';
				profileId: string | null;
			} | null;
		}
	}
}

export {};
