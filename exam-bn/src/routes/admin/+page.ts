import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { User, Exam, Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token } = await parent();

	const [users, exams, rooms] = await Promise.all([
		api.safeGet<User[]>(fetch, '/exam/users', [], { limit: 1000 }),
		api.safeGet<Exam[]>(fetch, '/exam/exams', [], { limit: 1000 }),
		api.safeGet<Room[]>(fetch, '/exam/rooms', [], { limit: 1000 })
	]);

	const now = new Date();
	const activeExams = exams.filter(
		(e) => new Date(e.startTime) <= now && new Date(e.endTime) >= now
	);
	const upcomingExams = exams.filter((e) => new Date(e.startTime) > now);
	const finishedExams = exams.filter((e) => new Date(e.endTime) < now);

	const recentExams = [...exams]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	return {
		stats: {
			totalUsers: users.length,
			adminCount: users.filter((u) => u.role === 'super_admin').length,
			supervisorCount: users.filter((u) => u.role === 'teacher').length,
			participantCount: users.filter((u) => u.role === 'student').length,
			totalExams: exams.length,
			activeExams: activeExams.length,
			upcomingExams: upcomingExams.length,
			finishedExams: finishedExams.length,
			totalRooms: rooms.length
		},
		recentExams: recentExams.map((e) => ({
			id: e.id,
			name: e.name,
			startTime: e.startTime,
			endTime: e.endTime,
			status:
				new Date(e.startTime) > now ? 'upcoming' : new Date(e.endTime) < now ? 'finished' : 'active'
		}))
	};
};
