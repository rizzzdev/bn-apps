CREATE TABLE "assignments" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "deadline" timestamp(3) NOT NULL,
  "status" text NOT NULL DEFAULT 'Draft'::text,
  "teacher_id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "deleted_at" timestamp(3),
  PRIMARY KEY ("id")
);


CREATE TABLE "assignment_attachments" (
  "id" text NOT NULL,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "assignment_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "assignment_attachments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE "assignment_classes" (
  "id" text NOT NULL,
  "assignment_id" text NOT NULL,
  "class_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "assignment_classes_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE "assignment_submissions" (
  "id" text NOT NULL,
  "assignment_id" text NOT NULL,
  "student_id" text NOT NULL,
  "file_url" text,
  "file_name" text,
  "content" text,
  "grade" int4,
  "feedback" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments" ("id") ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX assignment_submissions_assignment_id_student_id_key ON public.assignment_submissions USING btree (assignment_id, student_id);

CREATE TABLE "attachments" (
  "id" text NOT NULL,
  "filename" text NOT NULL,
  "format" text NOT NULL,
  "size" float8 NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(3),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX attachments_url_key ON public.attachments USING btree (url);
CREATE INDEX attachments_deleted_at_idx ON public.attachments USING btree (deleted_at);

CREATE TABLE "materials" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "status" text NOT NULL DEFAULT 'Draft'::text,
  "teacher_id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "deleted_at" timestamp(3),
  PRIMARY KEY ("id")
);


CREATE TABLE "material_attachments" (
  "id" text NOT NULL,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "material_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "material_attachments_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE "material_classes" (
  "id" text NOT NULL,
  "material_id" text NOT NULL,
  "class_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "material_classes_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE "material_reads" (
  "id" text NOT NULL,
  "material_id" text NOT NULL,
  "student_id" text NOT NULL,
  "read_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "material_reads_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE UNIQUE INDEX material_reads_material_id_student_id_key ON public.material_reads USING btree (material_id, student_id);

CREATE TABLE "quizzes" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "time_limit" int4,
  "status" text NOT NULL DEFAULT 'Draft'::text,
  "teacher_id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "deleted_at" timestamp(3),
  PRIMARY KEY ("id")
);


CREATE TABLE "quiz_classes" (
  "id" text NOT NULL,
  "quiz_id" text NOT NULL,
  "class_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "quiz_classes_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE "quiz_questions" (
  "id" text NOT NULL,
  "quiz_id" text NOT NULL,
  "question" text NOT NULL,
  "options" text NOT NULL,
  "correct_option" int4 NOT NULL,
  "order" int4 NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE "quiz_submissions" (
  "id" text NOT NULL,
  "quiz_id" text NOT NULL,
  "student_id" text NOT NULL,
  "score" int4,
  "started_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" timestamp(3),
  PRIMARY KEY ("id"),
  CONSTRAINT "quiz_submissions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX quiz_submissions_quiz_id_student_id_key ON public.quiz_submissions USING btree (quiz_id, student_id);

CREATE TABLE "quiz_answers" (
  "id" text NOT NULL,
  "submission_id" text NOT NULL,
  "quiz_question_id" text NOT NULL,
  "selected_option" int4 NOT NULL,
  "is_correct" bool NOT NULL DEFAULT false,
  PRIMARY KEY ("id"),
  CONSTRAINT "quiz_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "quiz_submissions" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


