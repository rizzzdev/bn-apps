-- Additive snapshot of the participant class at enrollment time.
ALTER TABLE "exam_participant" ADD COLUMN "class_id" TEXT;

-- Best-effort backfill for unambiguous historical participants.
-- Ambiguous and unmatched memberships intentionally remain NULL.
WITH candidate_classes AS (
  SELECT
    ep.id AS participant_id,
    MIN(scs.class_id) AS class_id
  FROM "exam_participant" ep
  JOIN "shadow_students" ss
    ON ss.user_id = ep.user_id
   AND ss.deleted_at IS NULL
  JOIN "shadow_class_students" scs
    ON scs.student_id = ss.id
   AND scs.status = 'Aktif'
   AND scs.deleted_at IS NULL
  JOIN "exam_room_class" erc
    ON erc.exam_room_id = ep.exam_room_id
   AND erc.class_id = scs.class_id
   AND erc.deleted_at IS NULL
  WHERE ep.class_id IS NULL
    AND ep.deleted_at IS NULL
  GROUP BY ep.id
  HAVING COUNT(DISTINCT scs.class_id) = 1
)
UPDATE "exam_participant" ep
SET class_id = candidate_classes.class_id
FROM candidate_classes
WHERE ep.id = candidate_classes.participant_id
  AND ep.class_id IS NULL;

CREATE INDEX "exam_participant_class_id_idx" ON "exam_participant"("class_id");
CREATE INDEX "exam_participant_exam_room_id_class_id_idx" ON "exam_participant"("exam_room_id", "class_id");
