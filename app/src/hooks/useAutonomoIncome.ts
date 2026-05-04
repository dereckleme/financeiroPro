import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  appendRow,
  ensureSheet,
  getValues,
  updateAccountBalance,
  updateRow,
} from '../services/googleSheets';
import { AutonomoReceita, AutonomoStatus } from '../types';
import { SHEET_NAMES, HEADERS } from '../../../sheets/schema';
import { generateId, nowISO } from '../utils/formatters';
import { appendRow as appendTx } from '../services/googleSheets';

const SHEET = SHEET_NAMES.AUTONOMO_RECEITAS;

function rowToReceita(row: string[]): AutonomoReceita {
  return {
    id:        row[0],
    data:      row[1],
    descricao: row[2],
    cliente:   row[3],
    valor:     parseFloat(row[4]) || 0,
    status:    (row[5] as AutonomoStatus) ?? 'pendente',
    conta_id:  row[6] ?? '',
    criado_em: row[7] ?? '',
  };
}

export function useAutonomoReceitas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['autonomo_receitas', user?.spreadsheetId],
    enabled: !!user?.spreadsheetId,
    queryFn: async () => {
      await ensureSheet(
        user!.accessToken,
        user!.spreadsheetId!,
        SHEET,
        HEADERS.autonomo_receitas as unknown as string[],
      );
      const rows = await getValues(
        user!.accessToken,
        user!.spreadsheetId!,
        `${SHEET}!A2:H`,
      );
      return rows
        .filter(r => r[0])
        .map(rowToReceita)
        .sort((a, b) => b.data.localeCompare(a.data));
    },
  });
}

export interface AddAutonomoInput {
  data: string;
  descricao: string;
  cliente: string;
  valor: number;
  conta_id: string;
  status: AutonomoStatus;
  categoriaId: string;
}

export function useAddAutonomoReceita() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddAutonomoInput) => {
      const token = user!.accessToken;
      const sid = user!.spreadsheetId!;
      const id = generateId();

      await appendRow(token, sid, SHEET, [
        id,
        input.data,
        input.descricao,
        input.cliente,
        input.valor,
        input.status,
        input.conta_id,
        nowISO(),
      ]);

      // Se já marcado como recebido, lança transação
      if (input.status === 'recebido') {
        await appendTx(token, sid, SHEET_NAMES.TRANSACOES, [
          generateId(),
          input.data,
          `${input.cliente} — ${input.descricao}`,
          input.valor,
          'receita',
          input.categoriaId,
          input.conta_id,
          'Autônomo',
          nowISO(),
        ]);
        await updateAccountBalance(token, sid, input.conta_id, input.valor);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autonomo_receitas'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useMarcarRecebido() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receita,
      rowIndex,
      categoriaId,
    }: {
      receita: AutonomoReceita;
      rowIndex: number; // 0-based index in the data rows
      categoriaId: string;
    }) => {
      const token = user!.accessToken;
      const sid = user!.spreadsheetId!;
      const rowNum = rowIndex + 2; // +1 header, +1 1-based

      // Atualiza status na planilha (coluna F = index 5)
      await updateRow(token, sid, `${SHEET}!F${rowNum}`, ['recebido']);

      // Lança transação de receita
      await appendTx(token, sid, SHEET_NAMES.TRANSACOES, [
        generateId(),
        receita.data,
        `${receita.cliente} — ${receita.descricao}`,
        receita.valor,
        'receita',
        categoriaId,
        receita.conta_id,
        'Autônomo',
        nowISO(),
      ]);

      await updateAccountBalance(token, sid, receita.conta_id, receita.valor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autonomo_receitas'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
