-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'ESSAY');

-- CreateEnum
CREATE TYPE "ExamRoomStatus" AS ENUM ('PENDING', 'ONGOING', 'ENDED');

-- CreateEnum
CREATE TYPE "ParticipantSubmitStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED');

-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam" (
    "id" TEXT NOT NULL,
    "question_creator_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "mc_weight" DOUBLE PRECISION,
    "essay_weight" DOUBLE PRECISION,
    "passing_grade" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_room" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "status" "ExamRoomStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_log" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_chat" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply_to_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_participant" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ParticipantSubmitStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_supervisor" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_correct_answer" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_correct_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_question" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answer" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_id" TEXT,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_score" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essay_grade" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "essay_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "nis" TEXT,
    "nisn" TEXT,
    "picture_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT,
    "nip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_log_exam_room_id_idx" ON "exam_log"("exam_room_id");

-- CreateIndex
CREATE INDEX "exam_chat_sender_id_receiver_id_idx" ON "exam_chat"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "exam_chat_receiver_id_sender_id_idx" ON "exam_chat"("receiver_id", "sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_participant_exam_room_id_user_id_key" ON "exam_participant"("exam_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_supervisor_exam_room_id_user_id_key" ON "exam_supervisor"("exam_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_correct_answer_question_id_key" ON "question_correct_answer"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_question_exam_room_id_question_id_key" ON "exam_question"("exam_room_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answer_exam_room_id_user_id_question_id_key" ON "exam_answer"("exam_room_id", "user_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_score_exam_room_id_user_id_key" ON "exam_score"("exam_room_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "essay_grade_exam_room_id_user_id_question_id_key" ON "essay_grade"("exam_room_id", "user_id", "question_id");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- CreateIndex
CREATE INDEX "shadow_students_user_id_idx" ON "shadow_students"("user_id");

-- CreateIndex
CREATE INDEX "shadow_students_deleted_at_idx" ON "shadow_students"("deleted_at");

-- CreateIndex
CREATE INDEX "shadow_teachers_user_id_idx" ON "shadow_teachers"("user_id");

-- CreateIndex
CREATE INDEX "shadow_teachers_deleted_at_idx" ON "shadow_teachers"("deleted_at");

-- AddForeignKey
ALTER TABLE "exam_room" ADD CONSTRAINT "exam_room_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_room" ADD CONSTRAINT "exam_room_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_log" ADD CONSTRAINT "exam_log_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_chat" ADD CONSTRAINT "exam_chat_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "exam_chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participant" ADD CONSTRAINT "exam_participant_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_supervisor" ADD CONSTRAINT "exam_supervisor_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "exam_answer" ADD CONSTRAINT "exam_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answer" ADD CONSTRAINT "exam_answer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_score" ADD CONSTRAINT "exam_score_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_grade" ADD CONSTRAINT "essay_grade_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_grade" ADD CONSTRAINT "essay_grade_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
