export const SHEET_NAMES = {
  META: 'meta',
  CONTAS: 'contas',
  CATEGORIAS: 'categorias',
  TRANSACOES: 'transacoes',
  ORCAMENTO: 'orcamento',
  METAS: 'metas',
} as const;

export const HEADERS = {
  meta: ['chave', 'valor'],
  contas: ['id', 'nome', 'tipo', 'saldo_inicial', 'saldo_atual', 'ativo', 'criado_em'],
  categorias: ['id', 'nome', 'tipo', 'cor', 'icone', 'ativo'],
  transacoes: ['id', 'data', 'descricao', 'valor', 'tipo', 'categoria_id', 'conta_id', 'observacao', 'criado_em'],
  orcamento: ['id', 'mes', 'ano', 'categoria_id', 'valor_planejado', 'criado_em'],
  metas: ['id', 'nome', 'valor_objetivo', 'valor_atual', 'data_objetivo', 'ativo', 'criado_em'],
} as const;

export const DEFAULT_CATEGORIES = [
  { nome: 'Alimentação',    tipo: 'despesa', cor: '#ef4444', icone: '🍔' },
  { nome: 'Transporte',     tipo: 'despesa', cor: '#f97316', icone: '🚗' },
  { nome: 'Moradia',        tipo: 'despesa', cor: '#8b5cf6', icone: '🏠' },
  { nome: 'Saúde',          tipo: 'despesa', cor: '#ec4899', icone: '💊' },
  { nome: 'Lazer',          tipo: 'despesa', cor: '#06b6d4', icone: '🎬' },
  { nome: 'Educação',       tipo: 'despesa', cor: '#10b981', icone: '📚' },
  { nome: 'Vestuário',      tipo: 'despesa', cor: '#f59e0b', icone: '👕' },
  { nome: 'Outros',         tipo: 'despesa', cor: '#6b7280', icone: '📌' },
  { nome: 'Salário',        tipo: 'receita', cor: '#22c55e', icone: '💰' },
  { nome: 'Freelance',      tipo: 'receita', cor: '#84cc16', icone: '💼' },
  { nome: 'Investimentos',  tipo: 'receita', cor: '#14b8a6', icone: '📈' },
  { nome: 'Outras Receitas',tipo: 'receita', cor: '#4f46e5', icone: '💵' },
] as const;
