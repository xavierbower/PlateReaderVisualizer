import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { SheetData, PlateBlock, ParsedInput } from '../types';

/**
 * Detect if columns are interleaved signal/background.
 * Heuristic: if even-indexed columns (0-based: 1,3,5,...) are consistently
 * much smaller than odd-indexed columns (0-based: 0,2,4,...), it's interleaved.
 */
function detectInterleaving(rows: number[][]): boolean {
  if (rows.length === 0 || rows[0].length < 4) return false;

  let oddSum = 0, evenSum = 0, count = 0;
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      if (c % 2 === 0) { oddSum += Math.abs(row[c]); }
      else { evenSum += Math.abs(row[c]); }
      count++;
    }
  }
  if (count === 0) return false;
  const ratio = oddSum / (evenSum || 1);
  // If odd-position values are >10x larger, likely interleaved
  return ratio > 10;
}

function extractSignalBackground(rows: number[][]): {
  signal: number[][];
  background: number[][] | null;
} {
  if (!detectInterleaving(rows)) {
    return { signal: rows.map(r => [...r]), background: null };
  }

  const signal: number[][] = [];
  const background: number[][] = [];
  for (const row of rows) {
    const sigRow: number[] = [];
    const bgRow: number[] = [];
    for (let c = 0; c < row.length; c++) {
      if (c % 2 === 0) sigRow.push(row[c]);
      else bgRow.push(row[c]);
    }
    signal.push(sigRow);
    background.push(bgRow);
  }
  return { signal, background };
}

/**
 * Parse a 2D array of cell values into plate blocks.
 * Blocks are separated by blank rows. Each block starts with a header row
 * containing "Temperature" and column numbers.
 */
function parseSheetRows(rawData: (string | number | null)[][]): PlateBlock[] {
  const blocks: PlateBlock[] = [];
  let currentRows: number[][] = [];
  let currentTemp = 26;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
      // Blank row — flush current block
      if (currentRows.length > 0) {
        const { signal, background } = extractSignalBackground(currentRows);
        blocks.push({
          temperature: currentTemp,
          rawRows: currentRows,
          signal,
          background,
        });
        currentRows = [];
      }
      continue;
    }

    const firstCell = String(row[0] ?? '').toLowerCase();
    if (firstCell.includes('temperature') || firstCell.includes('temp')) {
      // Header row — extract temperature from next data row or skip
      if (currentRows.length > 0) {
        const { signal, background } = extractSignalBackground(currentRows);
        blocks.push({
          temperature: currentTemp,
          rawRows: currentRows,
          signal,
          background,
        });
        currentRows = [];
      }
      continue;
    }

    // Data row — parse numbers
    const numRow: number[] = [];
    let startCol = 0;
    // First cell might be temperature or empty
    const firstVal = parseFloat(String(row[0] ?? ''));
    if (!isNaN(firstVal) && row.length > 1) {
      // Check if first value is a temperature (typically 20-40)
      const secondVal = parseFloat(String(row[1] ?? ''));
      if (firstVal >= 15 && firstVal <= 45 && !isNaN(secondVal)) {
        currentTemp = firstVal;
        startCol = 1;
      }
    }

    for (let c = startCol; c < row.length; c++) {
      const val = parseFloat(String(row[c] ?? '0'));
      numRow.push(isNaN(val) ? 0 : val);
    }

    if (numRow.length > 0) {
      currentRows.push(numRow);
    }
  }

  // Flush remaining
  if (currentRows.length > 0) {
    const { signal, background } = extractSignalBackground(currentRows);
    blocks.push({
      temperature: currentTemp,
      rawRows: currentRows,
      signal,
      background,
    });
  }

  return blocks;
}

/** Parse an Excel file buffer into PlateData */
export function parseExcel(buffer: ArrayBuffer, fileName: string): ParsedInput {
  const warnings: string[] = [];
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheets: SheetData[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: null,
    });

    const blocks = parseSheetRows(rawData);
    if (blocks.length === 0) {
      warnings.push(`Sheet "${sheetName}" had no parseable plate data`);
    }
    sheets.push({ name: sheetName, blocks });
  }

  return {
    data: { fileName, sheets },
    warnings,
  };
}

/** Parse CSV text into PlateData */
export function parseCSV(text: string, fileName: string): ParsedInput {
  const warnings: string[] = [];
  const result = Papa.parse<(string | number | null)[]>(text, {
    dynamicTyping: true,
    header: false,
    skipEmptyLines: false,
  });

  if (result.errors.length > 0) {
    warnings.push(...result.errors.map(e => e.message));
  }

  const blocks = parseSheetRows(result.data);
  if (blocks.length === 0) {
    warnings.push('No parseable plate data found in CSV');
  }

  return {
    data: {
      fileName,
      sheets: [{ name: 'Sheet 1', blocks }],
    },
    warnings,
  };
}

/** Parse tab-separated or comma-separated pasted text */
export function parsePastedText(text: string): ParsedInput {
  // Detect delimiter: tabs vs commas
  const tabCount = (text.match(/\t/g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  const result = Papa.parse<(string | number | null)[]>(text, {
    delimiter,
    dynamicTyping: true,
    header: false,
    skipEmptyLines: false,
  });

  const warnings: string[] = [];
  if (result.errors.length > 0) {
    warnings.push(...result.errors.map(e => e.message));
  }

  const blocks = parseSheetRows(result.data);

  // If no structured blocks found, try treating the whole thing as a single numeric grid
  if (blocks.length === 0) {
    const rows: number[][] = [];
    for (const row of result.data) {
      if (!row || row.every(c => c === null || c === '')) continue;
      const numRow = row.map(c => {
        const v = parseFloat(String(c ?? '0'));
        return isNaN(v) ? 0 : v;
      });
      rows.push(numRow);
    }
    if (rows.length > 0) {
      const { signal, background } = extractSignalBackground(rows);
      return {
        data: {
          fileName: 'Pasted Data',
          sheets: [{
            name: 'Sheet 1',
            blocks: [{
              temperature: 26,
              rawRows: rows,
              signal,
              background,
            }],
          }],
        },
        warnings,
      };
    }
    warnings.push('Could not parse any numeric data from pasted text');
  }

  return {
    data: {
      fileName: 'Pasted Data',
      sheets: [{ name: 'Sheet 1', blocks }],
    },
    warnings,
  };
}

/** Detect file type and parse accordingly */
export function parseFile(file: File): Promise<ParsedInput> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const name = file.name.toLowerCase();

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      reader.onload = (e) => {
        try {
          resolve(parseExcel(e.target!.result as ArrayBuffer, file.name));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
      reader.onload = (e) => {
        try {
          resolve(parseCSV(e.target!.result as string, file.name));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    } else {
      // Try as text
      reader.onload = (e) => {
        try {
          resolve(parseCSV(e.target!.result as string, file.name));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    }
  });
}
