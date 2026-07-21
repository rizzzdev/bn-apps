import ExcelJS from 'exceljs';

/**
 * Parse an Excel file buffer into an array of typed objects.
 * Column headers in the first row are used as keys.
 * @param buffer - The Excel file buffer
 * @param requiredColumns - Columns that must be present in the header row
 */
export async function parseExcel<T = Record<string, unknown>>(
  buffer: Buffer,
  requiredColumns: string[] = []
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
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
        const header = headers[colNumber - 1];
        if (header) {
          let val = '';
          if (cell.value instanceof Date) {
            val = cell.value.toISOString();
          } else {
            val = cell.text ?? cell.value?.toString() ?? '';
          }
          obj[header] = val;
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
    const missing = requiredColumns.filter(col => !headers.includes(col));
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }
  }

  return rows;
}

/**
 * Generate an Excel template file buffer with the given headers and an optional sample row.
 * @param headers - Column names for the first row
 * @param sheetName - Name of the Excel sheet
 * @param sampleRow - Optional sample data row
 * @param validations - Optional data validation rules (column -> list of allowed values)
 */
export async function generateExcelTemplate(
  headers: string[],
  sheetName: string = 'Sheet1',
  sampleRow?: Record<string, unknown>,
  validations?: Record<string, string[]>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

  if (sampleRow) {
    sheet.addRow(sampleRow);
  }

  if (validations) {
    headers.forEach((header, index) => {
      if (validations[header]) {
        const colLetter = sheet.getColumn(index + 1).letter;
        for (let i = 2; i <= 1000; i++) {
          sheet.getCell(`${colLetter}${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${validations[header].join(',')}"`]
          };
        }
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
