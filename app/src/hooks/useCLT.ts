import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  clearRange,
  ensureSheet,
  getValues,
  writeValues,
  appendRow,
  updateAccountBalance,
} from '../services/googleSheets';
import { CLTConfig } from '../types';
import { SHEET_NAMES, HEADERS } from '../../../sheets/schema';
import { generateId, nowISO, todayISO } from '../utils/formatters';

const SHEET = SHEET_NAMES.TRABALHO_CLT;

const DEFAULT_CONFIG: CLTConfig = {
  salario_bruto: 0,
  vr_diario: 0,
  dias_uteis: 22,
  va_mensal: 0,
  vt_mensal: 0,
  inss_override: 0,
  ir_override: 0,
  outros_descontos: 0,
  dia_pagamento: 5,
  conta_id: '',
};

function rowsToConfig(rows: string[][]): CLTConfig {
  const map: Record<string, string> = {};
  rows.forEach(([k, v]) => { if (k) map[k] = v ?? '0'; });
  return {
    salario_bruto:     parseFloat(map.salario_bruto     ?? '0'),
    vr_diario:         parseFloat(map.vr_diario         ?? '0'),
    dias_uteis:        parseInt  (map.dias_uteis        ?? '22'),
    va_mensal:         parseFloat(map.va_mensal         ?? '0'),
    vt_mensal:         parseFloat(map.vt_mensal         ?? '0'),
    inss_override:     parseFloat(map.inss_override     ?? '0'),
    ir_override:       parseFloat(map.ir_override       ?? '0'),
    outros_descontos:  parseFloat(map.outros_descontos  ?? '0'),
    dia_pagamento:     parseInt  (map.dia_pagamento     ?? '5'),
    conta_id:          map.conta_id ?? '',
  };
}

export function useCLTConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clt_config', user?.spreadsheetId],
    enabled: !!user?.spreadsheetId,
    queryFn: async () => {
      await ensureSheet(
        user!.accessToken,
        user!.spreadsheetId!,
        SHEET,
        HEADERS.trabalho_clt as unknown as string[],
      );
      const rows = await getValues(user!.accessToken, user!.spreadsheetId!, `${SHEET}!A2:B`);
      if (rows.length === 0) return DEFAULT_CONFIG;
      return rowsToConfig(rows);
    },
  });
}

export function useSaveCLTConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: CLTConfig) => {
      const token = user!.accessToken;
      const sid = user!.spreadsheetId!;
      await clearRange(token, sid, `${SHEET}!A2:B30`);
      const rows = Object.entries(config).map(([k, v]) => [k, String(v)]);
      await writeValues(token, sid, `${SHEET}!A2:B${rows.length + 1}`, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clt_config'] });
    },
  });
}

export function useRegisterSalario() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      liquido,
      conta_id,
      categoriaId,
      mes,
    }: {
      liquido: number;
      conta_id: string;
      categoriaId: string;
      mes: string; // YYYY-MM
    }) => {
      const token = user!.accessToken;
      const sid = user!.spreadsheetId!;
      const data = `${mes}-${String(new Date().getDate()).padStart(2, '0')}`;

      await appendRow(token, sid, SHEET_NAMES.TRANSACOES, [
        generateId(),
        data,
        `Salário ${new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        liquido,
        'receita',
        categoriaId,
        conta_id,
        'CLT - Salário líquido',
        nowISO(),
      ]);

      await updateAccountBalance(token, sid, conta_id, liquido);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
