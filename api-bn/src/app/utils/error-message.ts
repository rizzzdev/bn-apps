/**
 * Ekstrak pesan error dengan aman dari nilai yang dilempar (`unknown`).
 * Mendukung error biasa maupun ZodError yang mengekspos `issues` (mis. hasil
 * validasi pada jalur Excel/bulk). Dipakai sebagai pengganti `catch (err: any)`
 * agar blok catch tidak lagi bergantung pada tipe `any`.
 */
export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan'): string {
  if (err instanceof Error) {
    const zodIssues = (err as Error & { issues?: Array<{ message?: string }> }).issues;
    const firstIssue = zodIssues?.[0]?.message;
    if (firstIssue) return firstIssue;
    return err.message || fallback;
  }
  return fallback;
}
