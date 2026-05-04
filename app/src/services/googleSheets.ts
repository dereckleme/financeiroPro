import { HEADERS, SHEET_NAMES, DEFAULT_CATEGORIES } from '../../../sheets/schema';
import { generateId, nowISO } from '../utils/formatters';

const SHEETS_API = 'https://sheets.googleapis.com/v4';

async function request<T>(
  token: string,
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export async function getValues(
  token: string,
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const url = `${SHEETS_API}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const data = await request<{ values?: string[][] }>(token, 'GET', url);
  return data.values ?? [];
}

export async function appendRow(
  token: string,
  spreadsheetId: string,
  sheet: string,
  row: (string | number | boolean)[],
): Promise<void> {
  const url = `${SHEETS_API}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  await request(token, 'POST', url, { values: [row] });
}

export async function updateRow(
  token: string,
  spreadsheetId: string,
  range: string,
  row: (string | number | boolean)[],
): Promise<void> {
  const url = `${SHEETS_API}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await request(token, 'PUT', url, { values: [row] });
}

export async function batchUpdate(
  token: string,
  spreadsheetId: string,
  requests: unknown[],
): Promise<void> {
  const url = `${SHEETS_API}/spreadsheets/${spreadsheetId}:batchUpdate`;
  await request(token, 'POST', url, { requests });
}

export async function createSpreadsheet(token: string): Promise<string> {
  const url = `${SHEETS_API}/spreadsheets`;
  const body = {
    properties: { title: 'FinanceiroPro', locale: 'pt_BR' },
    sheets: Object.values(SHEET_NAMES).map((title, index) => ({
      properties: { title, index },
    })),
  };
  const data = await request<{ spreadsheetId: string }>(token, 'POST', url, body);
  return data.spreadsheetId;
}

export async function initializeSpreadsheet(
  token: string,
  spreadsheetId: string,
): Promise<void> {
  const now = nowISO();

  // Write headers for all sheets
  const headerUpdates = Object.entries(HEADERS).map(([sheet, headers]) => ({
    range: `${sheet}!A1:${String.fromCharCode(64 + headers.length)}1`,
    values: [headers],
  }));

  const url = `${SHEETS_API}/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  await request(token, 'POST', url, {
    valueInputOption: 'USER_ENTERED',
    data: headerUpdates,
  });

  // Meta info
  await appendRow(token, spreadsheetId, SHEET_NAMES.META, ['version', '1.0.0']);
  await appendRow(token, spreadsheetId, SHEET_NAMES.META, ['created_at', now]);

  // Default categories
  for (const cat of DEFAULT_CATEGORIES) {
    await appendRow(token, spreadsheetId, SHEET_NAMES.CATEGORIAS, [
      generateId(),
      cat.nome,
      cat.tipo,
      cat.cor,
      cat.icone,
      'true',
    ]);
  }
}

export async function updateAccountBalance(
  token: string,
  spreadsheetId: string,
  contaId: string,
  delta: number,
): Promise<void> {
  const rows = await getValues(token, spreadsheetId, `${SHEET_NAMES.CONTAS}!A2:E`);
  const idx = rows.findIndex(r => r[0] === contaId);
  if (idx === -1) return;
  const current = parseFloat(rows[idx][4]) || 0;
  const rowNum = idx + 2;
  await updateRow(token, spreadsheetId, `${SHEET_NAMES.CONTAS}!E${rowNum}`, [current + delta]);
}

export async function findOrCreateSpreadsheet(token: string): Promise<string> {
  // Search for existing FinanceiroPro spreadsheet
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='FinanceiroPro'+and+mimeType='application/vnd.google-apps.spreadsheet'+and+trashed=false&fields=files(id,name)`;
  const data = await request<{ files: { id: string; name: string }[] }>(
    token,
    'GET',
    searchUrl,
  );

  if (data.files.length > 0) {
    return data.files[0].id;
  }

  const spreadsheetId = await createSpreadsheet(token);
  await initializeSpreadsheet(token, spreadsheetId);
  return spreadsheetId;
}
