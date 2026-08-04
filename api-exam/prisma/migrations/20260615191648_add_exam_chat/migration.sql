-- CreateTable
CREATE TABLE "exam_chat" (
    "id" VARCHAR(25) NOT NULL,
    "exam_room_id" VARCHAR(25) NOT NULL,
    "user_id" VARCHAR(25) NOT NULL,
    "sender_name" VARCHAR(255) NOT NULL,
    "sender_role" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_chat_exam_room_id_idx" ON "exam_chat"("exam_room_id");

-- AddForeignKey
ALTER TABLE "exam_chat" ADD CONSTRAINT "exam_chat_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_chat" ADD CONSTRAINT "exam_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
