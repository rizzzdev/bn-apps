import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { prisma } from "#exam/database/index.js";
import { validate } from "#exam/middleware/validate.js";
import { asyncHandler } from "#exam/utils/asyncHandler.js";
import { sendResponse } from "#app/utils/response.js";
import { QuestionRepository } from "./question.repository.js";
import { QuestionService } from "./question.service.js";
import { QuestionController } from "./question.controller.js";
import { createQuestionSchema, updateQuestionSchema } from "./question.schema.js";
import type { Request } from "express";

const repository = new QuestionRepository(prisma);
const service = new QuestionService(repository);
const controller = new QuestionController(service);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// ── Template download ──────────────────────────────────────────────────────────
router.get("/template", (_req, res) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: template data
  const headers = ["type", "text", "option_a", "option_b", "option_c", "option_d", "correct"];
  const examples = [
    [
      "MULTIPLE_CHOICE",
      "Apa warna langit pada siang hari?",
      "Merah",
      "Biru",
      "Hijau",
      "Kuning",
      "B",
    ],
    ["MULTIPLE_CHOICE", "Berapakah hasil 5 x 8?", "35", "40", "45", "50", "B"],
    ["ESSAY", "Jelaskan proses terjadinya hujan!", "", "", "", "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  ws["!cols"] = [
    { wch: 20 }, // type
    { wch: 45 }, // text
    { wch: 22 }, // option_a
    { wch: 22 }, // option_b
    { wch: 22 }, // option_c
    { wch: 22 }, // option_d
    { wch: 10 }, // correct
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Soal");

  // Sheet 2: instructions
  const wsInfo = XLSX.utils.aoa_to_sheet([
    ["PETUNJUK PENGISIAN TEMPLATE SOAL"],
    [""],
    ["Kolom", "Keterangan"],
    ["type", "Isi MULTIPLE_CHOICE atau ESSAY"],
    ["text", "Teks pertanyaan (wajib diisi)"],
    [
      "option_a, option_b, ...",
      "Teks pilihan jawaban untuk MULTIPLE_CHOICE. Tambah kolom option_e, option_f, dst untuk lebih banyak pilihan. Kosongkan untuk ESSAY.",
    ],
    [
      "correct",
      "Huruf jawaban benar (A / B / C / ...) untuk MULTIPLE_CHOICE. Kosongkan untuk ESSAY.",
    ],
    [""],
    [
      "Catatan:",
      "Kolom option harus berurutan (option_a, option_b, dst). Kolom option pertama yang kosong menandai akhir dari daftar pilihan.",
    ],
  ]);
  wsInfo["!cols"] = [{ wch: 28 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Petunjuk");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  res.setHeader("Content-Disposition", 'attachment; filename="template_soal.xlsx"');
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.send(buf);
});

// ── Import questions from Excel ────────────────────────────────────────────────
router.post(
  "/import",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      res.status(400).json({ error: true, message: "File Excel wajib diupload." });
      return;
    }

    // examRoomId can be repeated (multiple rooms)
    const rawIds = req.query.examRoomId;
    const examRoomIds: string[] = rawIds
      ? Array.isArray(rawIds)
        ? (rawIds as string[])
        : [rawIds as string]
      : [];

    // Find the next question number from active (non-deleted) records only.
    let startNumber = 1;
    if (examRoomIds.length > 0) {
      const maxEq = await prisma.examQuestion.findFirst({
        where: { examRoomId: examRoomIds[0], deletedAt: null },
        orderBy: { questionNumber: "desc" },
      });
      if (maxEq) startNumber = maxEq.questionNumber + 1;
    }

    const wb = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (rows.length === 0) {
      res.status(400).json({ error: true, message: "File kosong atau tidak memiliki data." });
      return;
    }

    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const errors: string[] = [];
    let created = 0;
    let qNumber = startNumber;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const type = String(row["type"] ?? "")
        .trim()
        .toUpperCase();
      const text = String(row["text"] ?? "").trim();

      if (!text) {
        errors.push(`Baris ${rowNum}: kolom text kosong.`);
        continue;
      }
      if (type !== "MULTIPLE_CHOICE" && type !== "ESSAY") {
        errors.push(
          `Baris ${rowNum}: type harus MULTIPLE_CHOICE atau ESSAY, bukan "${String(row["type"] ?? "")}".`,
        );
        continue;
      }

      if (type === "MULTIPLE_CHOICE") {
        const optionTexts: string[] = [];
        for (const letter of alphabet) {
          const val = String(row[`option_${letter}`] ?? "").trim();
          if (!val) break;
          optionTexts.push(val);
        }
        if (optionTexts.length < 2) {
          errors.push(
            `Baris ${rowNum}: soal MULTIPLE_CHOICE wajib memiliki minimal 2 pilihan jawaban.`,
          );
          continue;
        }
        const correctLetter = String(row["correct"] ?? "")
          .trim()
          .toUpperCase();
        const correctIdx = correctLetter.charCodeAt(0) - 65;
        if (correctLetter.length !== 1 || correctIdx < 0 || correctIdx >= optionTexts.length) {
          errors.push(
            `Baris ${rowNum}: kolom correct "${correctLetter}" tidak valid (harus A–${String.fromCharCode(64 + optionTexts.length)}).`,
          );
          continue;
        }
      }

      try {
        const currentNumber = qNumber;
        await prisma.$transaction(async (tx) => {
          const question = await tx.question.create({
            data: { text, type: type as "MULTIPLE_CHOICE" | "ESSAY" },
          });

          if (type === "MULTIPLE_CHOICE") {
            const optionTexts: string[] = [];
            for (const letter of alphabet) {
              const val = String(row[`option_${letter}`] ?? "").trim();
              if (!val) break;
              optionTexts.push(val);
            }

            const createdOptions = await Promise.all(
              optionTexts.map((t) =>
                tx.option.create({ data: { questionId: question.id, text: t } }),
              ),
            );

            const correctLetter = String(row["correct"] ?? "")
              .trim()
              .toUpperCase();
            const correctIdx = correctLetter.charCodeAt(0) - 65;

            await tx.questionCorrectAnswer.create({
              data: { questionId: question.id, optionId: createdOptions[correctIdx].id },
            });
          }

          for (const examRoomId of examRoomIds) {
            await tx.examQuestion.create({
              data: { examRoomId, questionId: question.id, questionNumber: currentNumber },
            });
          }
        });

        qNumber++;
        created++;
      } catch (e: unknown) {
        errors.push(`Baris ${rowNum}: ${(e as Error).message}`);
      }
    }

    sendResponse(res, 201, `Import selesai. ${created} soal berhasil dibuat.`, { created, errors });
  }),
);

// ── Standard CRUD ──────────────────────────────────────────────────────────────
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createQuestionSchema), controller.create);
router.patch("/:id", validate(updateQuestionSchema), controller.updateById);
router.delete("/:id", controller.deleteById);

export default router;
