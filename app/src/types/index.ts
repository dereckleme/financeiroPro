export type AccountType =
  | 'conta_corrente'
  | 'poupanca'
  | 'cartao_credito'
  | 'dinheiro'
  | 'investimento';

export type TransactionType = 'receita' | 'despesa' | 'transferencia';

export type CategoryType = 'receita' | 'despesa';

export interface Account {
  id: string;
  nome: string;
  tipo: AccountType;
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
  criado_em: string;
}

export interface Category {
  id: string;
  nome: string;
  tipo: CategoryType;
  cor: string;
  icone: string;
  ativo: boolean;
}

export interface Transaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  categoria_id: string;
  conta_id: string;
  observacao: string;
  criado_em: string;
}

export interface Budget {
  id: string;
  mes: number;
  ano: number;
  categoria_id: string;
  valor_planejado: number;
  criado_em: string;
}

export interface Goal {
  id: string;
  nome: string;
  valor_objetivo: number;
  valor_atual: number;
  data_objetivo: string;
  ativo: boolean;
  criado_em: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  spreadsheetId?: string;
}

export interface MonthSummary {
  receitas: number;
  despesas: number;
  saldo: number;
  mes: string;
}
