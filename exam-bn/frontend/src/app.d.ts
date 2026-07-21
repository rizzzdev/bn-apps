declare namespace App {
	interface Locals {
		user?: UserProfile;
	}
}

interface UserProfile {
	id: string;
	fullname: string;
	username: string;
	role: 'ADMIN' | 'SUPERVISOR' | 'PARTICIPANT';
}
