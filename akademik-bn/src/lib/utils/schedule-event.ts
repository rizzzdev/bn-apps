import type { LessonHour, ScheduleEvent } from '$lib/types';

export interface EventGridSlot {
	id: string;
	subjectName: string;
	day: string;
	lessonHourId: string;
	notes: string | null;
	isEvent: true;
}

/**
 * Ekspansi daftar event menjadi slot grid per jam (berurutan dari jam mulai
 * berdasarkan `order` lesson hours). Digunakan bersama oleh halaman jadwal,
 * generator preview, dan halaman print.
 */
export function expandEventsToSlots(events: ScheduleEvent[], hours: LessonHour[]): EventGridSlot[] {
	const sorted = [...hours].sort((a, b) => a.order - b.order);
	const byOrder = new Map(sorted.map((h) => [h.order, h]));
	const result: EventGridSlot[] = [];

	for (const e of events) {
		if (e.deletedAt !== null) continue;
		const start = sorted.find((h) => h.id === e.startHourId);
		if (!start) continue;
		for (let o = start.order; o < start.order + e.durationHours; o++) {
			const hour = byOrder.get(o);
			if (!hour) break;
			result.push({
				id: `${e.id}_${hour.id}`,
				subjectName: e.name,
				day: e.day,
				lessonHourId: hour.id,
				notes: e.notes,
				isEvent: true
			});
		}
	}

	return result;
}
