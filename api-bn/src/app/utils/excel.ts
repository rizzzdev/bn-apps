import ExcelJS from 'exceljs';

/**
 * Specification of one column in an Excel template.
 * - `label`: human-readable text shown as the first row (e.g. "Nama Lengkap").
 * - `key`:   canonical machine key referenced by callers (e.g. "fullname").
 *           The data row added from `sampleRow` is keyed by this `key`;
 *           caller's mapping code (e.g. raw["fullname"]) doesn't change
 *           when the label is i18n'd.
 * - `width`: optional column width override (default 20).
 *
 * The helper also accepts a plain `string` for backwards compatibility —
 * in that case `label === key`.
 */
export type HeaderSpec = string | { label: string; key: string; width?: number };

function normalize(h: HeaderSpec): { label: string; key: string; width: number } {
  return typeof h === 'string'
    ? { label: h, key: h, width: 20 }
    : { label: h.label, key: h.key, width: h.width ?? 20 };
}

/**
 * Build a reverse map `{ label: canonicalKey }` from a HeaderSpec[].
 *
 * Pair this with `parseExcel(buffer, requiredColumns, headerMap)` so that an
 * Excel template whose first row shows Indonesian labels like "Nama Lengkap"
 * is normalized back to the canonical English key ("fullname") used by service
 * mapping code.
 *
 * Backwards compatible: when `headerMap` is omitted, `parseExcel` falls back
 * to using the first-row text verbatim as object keys, so old English-header
 * files still parse correctly.
 */
export function buildHeaderLabelMap(specs: HeaderSpec[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of specs) {
    const spec = typeof s === 'string' ? { label: s, key: s } : s;
    out[spec.label] = spec.key;
  }
  return out;
}

/**
 * Parse an Excel file buffer into an array of typed objects.
 * Column headers in the first row are used as keys, optionally normalized
 * via `headerMap` when the template uses i18n labels (e.g. "Nama Lengkap"
 * → "fullname").
 *
 * @param buffer           - The Excel file buffer
 * @param requiredColumns  - Canonical column keys that must be present
 *                           (compared against mapped keys when headerMap used).
 * @param headerMap        - Optional `{ label: canonicalKey }` map to normalize
 *                           i18n header labels back to their canonical keys.
 */
export async function parseExcel<T = Record<string, unknown>>(
  buffer: Buffer,
  requiredColumns: string[] = [],
  headerMap?: Record<string, string>,
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Excel file has no sheets');

  const rows: T[] = [];
  let headers: string[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // @ts-ignore
      headers = row.values.slice(1).map(v => String(v));
    } else {
      const obj: Record<string, unknown> = {};
      let isEmpty = true;
      row.eachCell((cell, colNumber) => {
        const headerText = headers[colNumber - 1];
        if (headerText) {
          // Normalize via headerMap when provided (i18n roundtrip); otherwise
          // fall back to raw text (legacy English headers keep working).
          const canonicalKey = headerMap?.[headerText] ?? headerText;
          let val = '';
          if (cell.value instanceof Date) {
            val = cell.value.toISOString();
          } else {
            val = cell.text ?? cell.value?.toString() ?? '';
          }
          obj[canonicalKey] = val;
          if (val.trim() !== '') isEmpty = false;
        }
      });
      if (!isEmpty) {
        rows.push(obj as T);
      }
    }
  });

  if (rows.length === 0) throw new Error('Excel file is empty or has no data rows');

  if (requiredColumns.length > 0) {
    // Required-column check uses canonical keys (post-mapping) so that
    // services passing requiredColumns=["fullname"] match the mapped header
    // "Nama Lengkap" → "fullname".
    const canonicalHeaders = headers.map((h) => headerMap?.[h] ?? h);
    const missing = requiredColumns.filter((col) => !canonicalHeaders.includes(col));
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }
  }

  return rows;
}

/**
 * Generate an Excel template file buffer with the given headers and an optional sample row.
 *
 * @param headers      - Either a plain `string[]` (label == key, backwards compat)
 *                       or `Array<{ label: string; key: string; width?: number }>`.
 *                       The first row of the generated Excel uses the `label`.
 *                       Data rows produced from `sampleRow` and validation lookup
 *                       use the `key`.
 * @param sheetName    - Name of the Excel sheet
 * @param sampleRow    - Optional sample data row (keyed by canonical `key`)
 * @param validations  - Optional data validation rules keyed by canonical `key`
 *                       (e.g. `validations['gender'] = ['L', 'P']` will be applied
 *                        on the column whose HeaderSpec.key === 'gender').
 *
 * Couple with the SAME `HeaderSpec[]` passed to `buildHeaderLabelMap()` when
 * parsed by `parseExcel(buffer, [...], headerMap)` so the upload roundtrip
 * remains consistent.
 */
export async function generateExcelTemplate(
  headers: HeaderSpec[],
  sheetName: string = 'Sheet1',
  sampleRow?: Record<string, unknown>,
  validations?: Record<string, string[]>
): Promise<Buffer> {
  const specs = headers.map(normalize);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // Use `key` as the column key (so data rows address by key) but `label`
  // as the visible header text.
  sheet.columns = specs.map((s) => ({
    header: s.label,
    key: s.key,
    width: s.width,
  }));

  if (sampleRow) {
    sheet.addRow(sampleRow);
  }

  if (validations) {
    specs.forEach((spec, index) => {
      const allowedValues = validations[spec.key];
      if (allowedValues && allowedValues.length > 0) {
        const colLetter = sheet.getColumn(index + 1).letter;
        for (let i = 2; i <= 1000; i++) {
          sheet.getCell(`${colLetter}${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${allowedValues.join(',')}"`],
          };
        }
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
