import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { appendRow, getValues } from '../services/googleSheets';
import { Transaction, TransactionType } from '../types';
import { generateId, nowISO } from '../utils/formatters';
import { HEADERS, SHEET_NAMES } from '../../../sheets/schema';

function rowToTransaction(row: string[]): Transaction {
  return {
    id: row[0],
    data: row[1],
    descricao: row[2],
    valor: parseFloat(row[3]) || 0,
    tipo: row[4] as TransactionType,
    categoria_id: row[5],
    conta_id: row[6],
    observacao: row[7] ?? '',
    criado_em: row[8] ?? '',
  };
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.spreadsheetId],
    enabled: !!user?.spreadsheetId,
    queryFn: async () => {
      const rows = await getValues(
        user!.accessToken,
        user!.spreadsheetId!,
        `${SHEET_NAMES.TRANSACOES}!A2:I`,
      );
      return rows
        .filter(r => r[0])
        .map(rowToTransaction)
        .sort((a, b) => b.data.localeCompare(a.data));
    },
  });
}

interface AddTransactionInput {
  data: string;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  categoria_id: string;
  conta_id: string;
  observacao?: string;
}

export function useAddTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTransactionInput) => {
      const row = [
        generateId(),
        input.data,
        input.descricao,
        input.valor,
        input.tipo,
        input.categoria_id,
        input.conta_id,
        input.observacao ?? '',
        nowISO(),
      ];
      await appendRow(
        user!.accessToken,
        user!.spreadsheetId!,
        SHEET_NAMES.TRANSACOES,
        row,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
