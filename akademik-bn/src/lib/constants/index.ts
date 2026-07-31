export const WORK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;
export type WorkDay = (typeof WORK_DAYS)[number];
