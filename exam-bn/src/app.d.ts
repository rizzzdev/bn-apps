declare global {
	namespace App {
		interface Locals {
			user?: UserProfile;
			accessDenied?: boolean;
		}
	}
}

export interface UserProfile {
	id: string;
	fullname: string;
	email: string | null;
	role: 'super_admin' | 'teacher' | 'student';
	roles?: string[];
	pictureUrl?: string | null;
	[key: string]: unknown;
}

export {};

