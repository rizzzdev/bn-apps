export type ClassItem = {
	id: string;
	name: string;
	teacherId: string;
};

export type Material = {
	id: string;
	classId: string;
	title: string;
	content: string;
	attachmentName?: string;
};

export type Assignment = {
	id: string;
	classId: string;
	title: string;
	description: string;
	dueDate: string;
};

export type AssignmentSubmission = {
	id: string;
	assignmentId: string;
	studentId: string;
	fileName: string;
	submittedAt: string;
	grade?: number;
	comment?: string;
};

export type Quiz = {
	id: string;
	classId: string;
	title: string;
};

export type QuizQuestion = {
	id: string;
	quizId: string;
	text: string;
	options: string[];
	correctOptionIndex: number;
};

export type QuizSubmission = {
	id: string;
	quizId: string;
	studentId: string;
	score: number;
	answers: number[]; // chosen index per question
};

class LmsStore {
	classes = $state<ClassItem[]>([
		{ id: 'c1', name: 'Matematika Dasar', teacherId: 't1' },
		{ id: 'c2', name: 'Fisika Lanjut', teacherId: 't1' }
	]);

	materials = $state<Material[]>([
		{
			id: 'm1',
			classId: 'c1',
			title: 'Pengenalan Aljabar',
			content: 'Silakan baca materi terlampir.',
			attachmentName: 'aljabar.pdf'
		}
	]);

	assignments = $state<Assignment[]>([
		{
			id: 'a1',
			classId: 'c1',
			title: 'Tugas Aljabar 1',
			description: 'Kerjakan soal 1-5.',
			dueDate: '2026-07-25T23:59'
		}
	]);

	assignmentSubmissions = $state<AssignmentSubmission[]>([]);

	quizzes = $state<Quiz[]>([{ id: 'q1', classId: 'c1', title: 'Kuis Harian 1' }]);

	quizQuestions = $state<QuizQuestion[]>([
		{
			id: 'qq1',
			quizId: 'q1',
			text: '1 + 1 = ?',
			options: ['1', '2', '3', '4'],
			correctOptionIndex: 1
		},
		{
			id: 'qq2',
			quizId: 'q1',
			text: '5 x 2 = ?',
			options: ['7', '10', '12', '15'],
			correctOptionIndex: 1
		}
	]);

	quizSubmissions = $state<QuizSubmission[]>([]);

	// Helpers
	getClassesForTeacher(teacherId: string) {
		return this.classes.filter((c) => c.teacherId === teacherId);
	}

	// (Simulasi) Murid s1 ikut semua kelas
	getClassesForStudent(studentId: string) {
		return this.classes;
	}

	addMaterial(material: Omit<Material, 'id'>) {
		const newMaterial = { ...material, id: 'm' + Date.now() };
		this.materials.push(newMaterial);
	}

	addAssignment(assignment: Omit<Assignment, 'id'>) {
		const newAssignment = { ...assignment, id: 'a' + Date.now() };
		this.assignments.push(newAssignment);
	}

	submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) {
		const existingIndex = this.assignmentSubmissions.findIndex(
			(s) => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId
		);
		const newSubmission = {
			...submission,
			id: 'as' + Date.now(),
			submittedAt: new Date().toISOString()
		};
		if (existingIndex >= 0) {
			this.assignmentSubmissions[existingIndex] = newSubmission; // override
		} else {
			this.assignmentSubmissions.push(newSubmission);
		}
	}

	gradeAssignment(submissionId: string, grade: number, comment: string) {
		const s = this.assignmentSubmissions.find((x) => x.id === submissionId);
		if (s) {
			s.grade = grade;
			s.comment = comment;
		}
	}

	submitQuiz(quizId: string, studentId: string, answers: number[]) {
		const questions = this.quizQuestions.filter((q) => q.quizId === quizId);
		let correct = 0;
		questions.forEach((q, idx) => {
			if (q.correctOptionIndex === answers[idx]) {
				correct++;
			}
		});
		const score = Math.round((correct / questions.length) * 100);
		this.quizSubmissions.push({ id: 'qs' + Date.now(), quizId, studentId, score, answers });
		return score;
	}
}

export const lmsStore = new LmsStore();
