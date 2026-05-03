/**
 * Script de setup do Google Sheets para desenvolvimento.
 * Cria uma planilha FinanceiroPro com toda a estrutura de abas e dados iniciais.
 *
 * Uso:
 *   1. Configure um Service Account no Google Cloud Console
 *   2. Baixe o JSON de credenciais e salve como sheets/credentials.json
 *   3. Execute: npm run setup
 */
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { HEADERS, SHEET_NAMES, DEFAULT_CATEGORIES } from './schema';

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function main() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ credentials.json não encontrado em sheets/');
    console.error('   Baixe as credenciais de Service Account do Google Cloud Console.');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  console.log('🚀 Criando planilha FinanceiroPro...');

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'FinanceiroPro', locale: 'pt_BR' },
      sheets: Object.values(SHEET_NAMES).map((title, index) => ({
        properties: { title, index },
      })),
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;
  const spreadsheetUrl = spreadsheet.data.spreadsheetUrl!;

  console.log(`✅ Planilha criada: ${spreadsheetId}`);

  // Write headers
  const headerData = Object.entries(HEADERS).map(([sheet, headers]) => ({
    range: `${sheet}!A1`,
    values: [headers],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: headerData,
    },
  });

  // Meta
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: SHEET_NAMES.META,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['version', '1.0.0'],
        ['created_at', new Date().toISOString()],
      ],
    },
  });

  // Default categories
  const catRows = DEFAULT_CATEGORIES.map(c => [
    generateId(), c.nome, c.tipo, c.cor, c.icone, 'true',
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: SHEET_NAMES.CATEGORIAS,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: catRows },
  });

  // Format header rows (bold + freeze)
  const sheetIds = spreadsheet.data.sheets?.map(s => s.properties?.sheetId!) ?? [];
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: sheetIds.flatMap(sheetId => [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.06, green: 0.09, blue: 0.14 } } },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
      ]),
    },
  });

  console.log('✅ Estrutura inicializada com sucesso');
  console.log('');
  console.log('📋 Planilha:', spreadsheetUrl);
  console.log('🔑 ID:', spreadsheetId);
  console.log('');
  console.log('Adicione ao seu .env:');
  console.log(`EXPO_PUBLIC_SPREADSHEET_ID=${spreadsheetId}`);
}

main().catch(console.error);
