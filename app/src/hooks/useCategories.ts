import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getValues } from '../services/googleSheets';
import { Category, CategoryType } from '../types';
import { SHEET_NAMES } from '../../../sheets/schema';

function rowToCategory(row: string[]): Category {
  return {
    id: row[0],
    nome: row[1],
    tipo: row[2] as CategoryType,
    cor: row[3],
    icone: row[4],
    ativo: row[5] === 'true',
  };
}

export function useCategories(tipo?: CategoryType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.spreadsheetId, tipo],
    enabled: !!user?.spreadsheetId,
    queryFn: async () => {
      const rows = await getValues(
        user!.accessToken,
        user!.spreadsheetId!,
        `${SHEET_NAMES.CATEGORIAS}!A2:F`,
      );
      const all = rows.filter(r => r[0] && r[5] === 'true').map(rowToCategory);
      return tipo ? all.filter(c => c.tipo === tipo) : all;
    },
  });
}
