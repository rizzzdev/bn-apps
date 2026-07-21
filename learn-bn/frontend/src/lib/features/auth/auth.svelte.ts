export type UserRole = 'teacher' | 'student' | null;

class AuthState {
	user = $state<{ name: string; role: UserRole; id: string } | null>(null);

	loginAs(role: UserRole) {
		if (role === 'teacher') {
			this.user = { id: 't1', name: 'Budi (Guru)', role: 'teacher' };
		} else if (role === 'student') {
			this.user = { id: 's1', name: 'Andi (Murid)', role: 'student' };
		} else {
			this.user = null;
		}
	}

	logout() {
		this.user = null;
	}
}

export const authState = new AuthState();
