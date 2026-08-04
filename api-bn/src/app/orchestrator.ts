// =============================================================================
//  orchestrator.ts  —  aggregator of all cross-module repository ports
// =============================================================================
import {
  MasterAcademicYearRepository,
  MasterClassRepository,
  MasterTeacherRepository,
  MasterSubjectRepository,
  MasterMajorRepository,
  MasterStudentRepository,
} from '#master/services/master-data.service.js';
import {
  AcademicClassStudentRepository,
} from '#academic/services/academic-data.service.js';
import {
  InternshipIndustryMentorRepository,
  InternshipStudentRepository,
  InternshipTeacherRepository,
  InternshipCompanyRepository,
  InternshipPlacementRepository,
} from '#internship/services/internship-data.service.js';
import {
  LearnMaterialRepository,
  LearnAssignmentRepository,
  LearnQuizRepository,
  LearnSubmissionRepository,
  LearnAttachmentRepository,
} from '#learn/services/learn-data.service.js';  // @learn/* → ./src/learn/*
import {
  ExamRoomRepository,
  ExamRepository,
  ExamParticipantRepository,
  ExamSupervisorRepository,
} from '#exam/services/exam-data.service.js';
import {
  authDataService,
} from '#auth/services/auth-data.service.js';
import type {
  IMasterAcademicYearRepository,
  IMasterClassRepository,
  IMasterTeacherRepository,
  IMasterSubjectRepository,
  IMasterMajorRepository,
  IMasterStudentRepository,
  IMasterAuthRepository,
} from '#app/ports/master-data.port.js';
import type {
  IAcademicClassStudentRepository,
} from '#app/ports/academic-data.port.js';
import type {
  IAuthDataRepository,
} from '#app/ports/auth-data.port.js';
import type {
  IInternshipIndustryMentorRepository,
  IInternshipStudentRepository,
  IInternshipTeacherRepository,
  IInternshipCompanyRepository,
  IInternshipPlacementRepository,
} from '#app/ports/internship-data.port.js';
import type {
  ILearnMaterialRepository,
  ILearnAssignmentRepository,
  ILearnQuizRepository,
  ILearnSubmissionRepository,
  ILearnAttachmentRepository,
} from '#app/ports/learn-data.port.js';
import type {
  IExamRoomRepository,
  IExamRepository,
  IExamParticipantRepository,
  IExamSupervisorRepository,
} from '#app/ports/exam-data.port.js';

export class Orchestrator {
  // -- Master data ------------------------------------------------------------
  readonly masterAcademicYear: IMasterAcademicYearRepository;
  readonly masterClass: IMasterClassRepository;
  readonly masterTeacher: IMasterTeacherRepository;
  readonly masterSubject: IMasterSubjectRepository;
  readonly masterMajor: IMasterMajorRepository;
  readonly masterStudent: IMasterStudentRepository;
  readonly masterAuth: IMasterAuthRepository;

  // -- Auth -------------------------------------------------------------------
  readonly authData: IAuthDataRepository;

  // -- Academic ---------------------------------------------------------------
  readonly academicClassStudent: IAcademicClassStudentRepository;

  // -- Internship (derivative data — was accessed directly via prisma) -------
  readonly internshipIndustryMentor: IInternshipIndustryMentorRepository;
  readonly internshipStudent: IInternshipStudentRepository;
  readonly internshipTeacher: IInternshipTeacherRepository;
  readonly internshipCompany: IInternshipCompanyRepository;
  readonly internshipPlacement: IInternshipPlacementRepository;

  // -- Learn (derivative data — was accessed directly via prisma) -------------
  readonly learnMaterial: ILearnMaterialRepository;
  readonly learnAssignment: ILearnAssignmentRepository;
  readonly learnQuiz: ILearnQuizRepository;
  readonly learnSubmission: ILearnSubmissionRepository;
  readonly learnAttachment: ILearnAttachmentRepository;

  // -- Exam (derivative data) -------------------------------------------------
  readonly examRoom: IExamRoomRepository;
  readonly exam: IExamRepository;
  readonly examParticipant: IExamParticipantRepository;
  readonly examSupervisor: IExamSupervisorRepository;

  constructor() {
    this.masterAcademicYear = new MasterAcademicYearRepository();
    this.masterClass = new MasterClassRepository();
    this.masterTeacher = new MasterTeacherRepository();
    this.masterSubject = new MasterSubjectRepository();
    this.masterMajor = new MasterMajorRepository();
    this.masterStudent = new MasterStudentRepository();
    this.masterAuth = authDataService;
    this.authData = authDataService;
    this.academicClassStudent = new AcademicClassStudentRepository();
    this.internshipIndustryMentor = new InternshipIndustryMentorRepository();
    this.internshipStudent = new InternshipStudentRepository();
    this.internshipTeacher = new InternshipTeacherRepository();
    this.internshipCompany = new InternshipCompanyRepository();
    this.internshipPlacement = new InternshipPlacementRepository();
    this.learnMaterial = new LearnMaterialRepository();
    this.learnAssignment = new LearnAssignmentRepository();
    this.learnQuiz = new LearnQuizRepository();
    this.learnSubmission = new LearnSubmissionRepository();
    this.learnAttachment = new LearnAttachmentRepository();
    this.examRoom = new ExamRoomRepository();
    this.exam = new ExamRepository();
    this.examParticipant = new ExamParticipantRepository();
    this.examSupervisor = new ExamSupervisorRepository();
  }
}

let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}
