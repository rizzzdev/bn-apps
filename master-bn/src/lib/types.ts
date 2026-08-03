export interface Student {
	id: string;
	name: string;
	fullname: string;
	nis?: string | null;
	nisn?: string | null;
	nik?: string | null;
	email?: string | null;
	phone?: string | null;
	phoneNumber?: string | null;
	address?: string | null;
	status: string;
	classId?: string | null;
	currentClass?: { id?: string; name?: string } | null;
	currentMajor?: { id?: string; name?: string } | null;
	ethnicGroup?: string | null;
	birthplace?: string | null;
	birthdate?: string | Date | null;
	gender?: string | null;
	religion?: string | null;
	bloodType?: string | null;
	height?: number | null;
	weight?: number | null;
	parentPhone?: string | null;
	pictureId?: string | null;
	picture?: Attachment | null;
	[key: string]: unknown;
}

export interface Teacher {
	id: string;
	name: string;
	fullname: string;
	nip?: string | null;
	nik?: string | null;
	email?: string | null;
	phone?: string | null;
	phoneNumber?: string | null;
	address?: string | null;
	status: string;
	subjectId?: string | null;
	birthplace?: string | null;
	birthdate?: string | Date | null;
	gender?: string | null;
	religion?: string | null;
	bloodType?: string | null;
	height?: number | null;
	weight?: number | null;
	prefixTitle?: string | null;
	suffixTitle?: string | null;
	pictureId?: string | null;
	picture?: Attachment | null;
	[key: string]: unknown;
}

export interface Class {
	id: string;
	name: string;
	majorId?: string | null;
	level?: string | null;
	major?: Major | null;
	[key: string]: unknown;
}

export interface Major {
	classCount?: number;
	_count?: { classes: number };
	id: string;
	name: string;
	code: string;
	[key: string]: unknown;
}

export interface Subject {
	id: string;
	name: string;
	code: string;
	[key: string]: unknown;
}

export interface AcademicYear {
	startYear?: string;
	endYear?: string;
	id: string;
	name: string;
	startDate?: string;
	endDate?: string;
	status: string;
	[key: string]: unknown;
}

export interface Semester {
	id: string;
	academicYearId?: string;
	type: string;
	status: string;
	[key: string]: unknown;
}

export interface Attachment {
	id: string;
	filename: string;
	format: string;
	size: number;
	url: string;
	createdAt?: string;
	deletedAt?: string | null;
	[key: string]: unknown;
}

export interface User {
	id: string;
	identifier?: string;
	roles: string[];
	sentri_identifiers?: Array<{ type: string; value: string }>;
	[key: string]: unknown;
}
