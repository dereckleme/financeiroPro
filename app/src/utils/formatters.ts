export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function nowISO(): string {
  return new Date().toISOString();
}
