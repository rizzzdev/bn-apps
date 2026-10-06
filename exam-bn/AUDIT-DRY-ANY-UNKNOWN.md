# Audit DRY, Reusable UI, `any`, dan `unknown`

Tanggal audit: 6 Agustus 2026  
Scope: frontend `exam-bn/src` dan service `api-bn/src/exam/src`.

## Ringkasan angka

Angka dihitung pada source TypeScript/Svelte, dengan direktori Prisma generated dikeluarkan dari target refactor manual.

| Area             | `any` | `unknown` | Raw `<button>` | `<Button>/<IconButton>` |
| ---------------- | ----: | --------: | -------------: | ----------------------: |
| Frontend         |   123 |        59 |             38 |                      76 |
| API service exam |     9 |        35 |              — |                       — |

Hitungan token mencakup komentar dan beberapa boundary type; angka ini adalah inventory, bukan jumlah seluruh lokasi yang aman diubah.

## Perubahan yang diterapkan

- Aksi UI standar dipindahkan ke `Button`/`IconButton` pada layout, logout, monitoring peserta, answer monitor, warning modal, theme toggle, halaman result, dan halaman statistik.
- Exam selector pada statistik menggunakan `Button` variant `ghost`; kontrol khusus seperti pagination, custom select, navigasi nomor soal, dan chat tetap native karena memiliki perilaku/layout spesifik.
- `IconButton` dan `Button` meneruskan `aria-label` sehingga migrasi tombol ikon tidak kehilangan accessible name.
- `AnswerMonitor`, `ExamMonitor`, layout socket, `ChatWidget`, `Select`, debounce, dan status ujian memakai tipe domain/realtime yang lebih spesifik.
- Payload realtime dipusatkan di `src/lib/types/realtime.ts`.
- Socket answer update menangani `optionId: null` untuk menghapus pilihan lama.

## Temuan `any` frontend

Prioritas tinggi:

- `src/lib/components/admin/ExamDetail.svelte` — 20 token; banyak pemetaan `data` dan objek directory masih `any`.
- `src/lib/components/admin/ExamRoomDetail.svelte` — 18 token; peserta, guru, kelas, dan form perlu tipe page-data/domain.
- `src/routes/admin/exams/+page.svelte` — 11 token; mapel, guru, form action, dan response perlu tipe eksplisit.
- Tiga halaman detail jawaban peserta — masing-masing 6 token; gunakan tipe question/answer hasil load.
- `src/lib/components/supervisor/QuestionsDetail.svelte` — 5 token; gunakan `Question`, `Option`, dan tipe action.
- `src/lib/utils/fullscreen.ts` — 5 token; gunakan interface capability untuk prefixed Fullscreen API, bukan cast `any`.

Prioritas menengah:

- `src/lib/components/chat/ChatWidget.svelte` sudah diperbaiki untuk socket, conversation, dan message payload; boundary response API masih dapat diperketat dengan schema/parser.
- `src/lib/components/ui/Select.svelte` sudah mengganti `any` menjadi `string | string[]`.
- `src/lib/utils/debounce.ts` sudah mengganti generic `any` dengan `unknown`/`never` constraint.
- Cast `as any` pada data legacy participant dan route loader masih perlu diganti dengan tipe page data yang dibagikan.

## Temuan `unknown` frontend

Sebagian besar penggunaan `unknown` bersifat tepat dan sebaiknya dipertahankan:

- `catch (e: unknown)` adalah praktik aman; narrowing dilakukan ketika pesan error dibaca.
- Body request pada `api.ts` dan `server/api.ts` memang menerima data lintas endpoint; idealnya nanti gunakan DTO generik per endpoint, bukan mengganti dengan `any`.
- JWT claims dan `App.Locals` adalah data eksternal; `unknown` lebih aman daripada `any`.
- `null as unknown as DomainType` pada fallback loader menandakan API helper belum mendukung nullable fallback secara ergonomis. Perbaikan terbaik adalah membuat fallback `T | null`, bukan menghapus cast secara membabi buta.

## Temuan API service exam

### `any` (9 token)

- `src/socket/exam-queue.ts`: 4 cast `io as any`. Ini aman dihapus dengan memakai tipe `ExamServer` socket.io yang sama seperti `exam-lifecycle.ts`/`socket-manager.ts`.
- `src/socket/socket.handler.ts`: mock socket disconnect dan satu cast boundary. Ganti dengan factory/mock type minimal atau pisahkan fungsi violation agar tidak membutuhkan socket penuh.
- `src/types/express.d.ts`: index signature user menggunakan `any`; ubah menjadi `unknown` atau model claims terdefinisi.
- Prisma generated client/type files tidak menjadi target manual cleanup.

### `unknown` (35 token)

- Repository Prisma memakai `as unknown as DomainType` karena model database generated dan domain DTO belum disatukan. Ini compile-safe tetapi menyembunyikan ketidakcocokan shape; prioritas berikutnya adalah memakai `Prisma.*GetPayload` atau mapper eksplisit.
- `logger.ts` menerima `unknown` dengan tepat untuk error/context logging.
- validator XLSX memakai `Record<string, unknown>` dengan tepat karena spreadsheet adalah input eksternal.
- `catch (e: unknown)` dipertahankan.
- `room.types.ts` memiliki `examRooms?: unknown[]`; sebaiknya diganti tipe relasi Prisma/domain jika field benar-benar dipakai.

## DRY findings

- Logout fetch dan pembersihan cookie masih terduplikasi di `AppLayout.svelte` dan `Forbidden.svelte`; kandidat aman: helper `logout()` di `src/lib/utils` setelah kontrak redirect dipastikan.
- Markup export Excel berulang di result/statistics; kandidat aman: `ExportButton.svelte` atau helper icon snippet, tanpa menyatukan perilaku export.
- Notification socket listener pada tiga role layout hampir identik; kandidat aman: component/action helper shared untuk listener dan cleanup.
- Mapping report/statistics rows juga berulang antara admin dan supervisor; kandidat aman: utility typed yang memakai shared report types.

## Pengecualian yang disengaja

Raw button dipertahankan untuk pagination, `CustomSelect`, `ExamOption`, grid navigasi soal, dan kontrol chat yang memiliki keyboard, nested interaction, atau styling khusus. Mengganti semuanya dengan `Button` akan menambah coupling dan berisiko merusak UX.

## Prioritas lanjutan

1. Hilangkan `io as any` API dan perketat `Express.Request.user`.
2. Buat tipe shared untuk `ExamDetail`/`ExamRoomDetail` dan form actions.
3. Buat typed API response/parser agar loader tidak memakai `null as unknown as T`.
4. Ekstrak helper logout, notification listener, dan export action setelah kontrak UI stabil.
5. Terapkan pagination/report server-side untuk dataset besar; ini terpisah dari audit tipe/UI.
