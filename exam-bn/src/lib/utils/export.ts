import * as XLSX from 'xlsx';

type CellValue = string | number | null | undefined;

interface ExcelSheet {
	name: string;
	headers: string[];
	rows: Record<string, CellValue>[];
	keys: string[];
}

function buildWorkbook(sheets: ExcelSheet[]): XLSX.WorkBook {
	const wb = XLSX.utils.book_new();

	for (const sheet of sheets) {
		// Convert rows to array of arrays including headers
		const data = [
			sheet.headers,
			...sheet.rows.map((row) => sheet.keys.map((k) => row[k]))
		];
		const ws = XLSX.utils.aoa_to_sheet(data);
		XLSX.utils.book_append_sheet(wb, ws, sheet.name);
	}

	return wb;
}

function downloadXlsx(filename: string, wb: XLSX.WorkBook): void {
	const actualFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
	XLSX.writeFile(wb, actualFilename);
}

/** Export a single sheet to .xlsx */
export function exportToExcel(
	filename: string,
	sheetName: string,
	headers: string[],
	rows: Record<string, CellValue>[],
	keys: string[]
): void {
	downloadXlsx(filename, buildWorkbook([{ name: sheetName, headers, rows, keys }]));
}

/** Export multiple sheets to one .xlsx file */
export function exportToExcelMultiSheet(filename: string, sheets: ExcelSheet[]): void {
	downloadXlsx(filename, buildWorkbook(sheets));
}
