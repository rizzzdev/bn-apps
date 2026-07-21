-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'ESSAY');

-- CreateEnum
CREATE TYPE "ExamRoomStatus" AS ENUM ('PENDING', 'ONGOING', 'ENDED');

-- CreateTable
CREATE TABLE "user" (
    "id" VARCHAR(25) NOT NULL,
    "fullname" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_audit" (
    "id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "login_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "capacity" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam" (
    "id" VARCHAR(25) NOT NULL,
    "question_creator_id" VARCHAR(25),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "mc_weight" DOUBLE PRECISION,
    "essay_weight" DOUBLE PRECISION,
    "passing_grade" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_room" (
    "id" VARCHAR(25) NOT NULL,
    "exam_id" VARCHAR(25) NOT NULL,
    "room_id" VARCHAR(25) NOT NULL,
    "status" "ExamRoomStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "exam_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_log" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25),
    "type" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_participant" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_supervisor" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" VARCHAR(25) NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option" (
    "id" VARCHAR(25) NOT NULL,
    "question_id" VARCHAR(25) NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_correct_answer" (
    "id" VARCHAR(25) NOT NULL,
    "question_id" VARCHAR(25) NOT NULL,
    "option_id" VARCHAR(25) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "question_correct_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_question" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "question_id" VARCHAR(25) NOT NULL,
    "question_number" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "exam_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answer" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "question_id" VARCHAR(25) NOT NULL,
    "option_id" VARCHAR(25),
    "text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_score" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "exam_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essay_grade" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "question_id" VARCHAR(25) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "essay_grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_id_idx" ON "user"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "room_id_idx" ON "room"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "exam_id_idx" ON "exam"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "exam_room_id_idx" ON "exam_room"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "exam_log_exam_room_id_idx" ON "exam_log"("exam_room_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_participant_exam_room_id_user_id_key" ON "exam_participant"("exam_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_supervisor_exam_room_id_user_id_key" ON "exam_supervisor"("exam_room_id", "user_id");

-- CreateIndex
CREATE INDEX "question_id_idx" ON "question"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "option_id_idx" ON "option"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "question_correct_answer_question_id_key" ON "question_correct_answer"("question_id");

-- CreateIndex
CREATE INDEX "exam_question_room_number_active_uidx" ON "exam_question"("exam_room_id", "question_number") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "exam_question_id_idx" ON "exam_question"("id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "exam_question_exam_room_id_question_id_key" ON "exam_question"("exam_room_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answer_exam_room_id_user_id_question_id_key" ON "exam_answer"("exam_room_id", "user_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_score_exam_room_id_user_id_key" ON "exam_score"("exam_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "essay_grade_exam_room_id_user_id_question_id_key" ON "essay_grade"("exam_room_id", "user_id", "question_id");

-- AddForeignKey
ALTER TABLE "login_audit" ADD CONSTRAINT "login_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam" ADD CONSTRAINT "exam_question_creator_id_fkey" FOREIGN KEY ("question_creator_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_room" ADD CONSTRAINT "exam_room_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_room" ADD CONSTRAINT "exam_room_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_log" ADD CONSTRAINT "exam_log_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_log" ADD CONSTRAINT "exam_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participant" ADD CONSTRAINT "exam_participant_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participant" ADD CONSTRAINT "exam_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_supervisor" ADD CONSTRAINT "exam_supervisor_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_supervisor" ADD CONSTRAINT "exam_supervisor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option" ADD CONSTRAINT "option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_correct_answer" ADD CONSTRAINT "question_correct_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_correct_answer" ADD CONSTRAINT "question_correct_answer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_question" ADD CONSTRAINT "exam_question_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_question" ADD CONSTRAINT "exam_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answer" ADD CONSTRAINT "exam_answer_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answer" ADD CONSTRAINT "exam_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answer" ADD CONSTRAINT "exam_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answer" ADD CONSTRAINT "exam_answer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_score" ADD CONSTRAINT "exam_score_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_score" ADD CONSTRAINT "exam_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_grade" ADD CONSTRAINT "essay_grade_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_grade" ADD CONSTRAINT "essay_grade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_grade" ADD CONSTRAINT "essay_grade_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
