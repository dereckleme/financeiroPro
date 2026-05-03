import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { appendRow, getValues } from '../services/googleSheets';
import { Account, AccountType } from '../types';
import { generateId, nowISO } from '../utils/formatters';
import { SHEET_NAMES } from '../../../sheets/schema';

function rowToAccount(row: string[]): Account {
  return {
    id: row[0],
    nome: row[1],
    tipo: row[2] as AccountType,
    saldo_inicial: parseFloat(row[3]) || 0,
    saldo_atual: parseFloat(row[4]) || 0,
    ativo: row[5] === 'true',
    criado_em: row[6] ?? '',
  };
}

export function useAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accounts', user?.spreadsheetId],
    enabled: !!user?.spreadsheetId,
    queryFn: async () => {
      const rows = await getValues(
        user!.accessToken,
        user!.spreadsheetId!,
        `${SHEET_NAMES.CONTAS}!A2:G`,
      );
      return rows.filter(r => r[0] && r[5] === 'true').map(rowToAccount);
    },
  });
}

interface AddAccountInput {
  nome: string;
  tipo: AccountType;
  saldo_inicial: number;
}

export function useAddAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddAccountInput) => {
      const row = [
        generateId(),
        input.nome,
        input.tipo,
        input.saldo_inicial,
        input.saldo_inicial,
        'true',
        nowISO(),
      ];
      await appendRow(
        user!.accessToken,
        user!.spreadsheetId!,
        SHEET_NAMES.CONTAS,
        row,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
