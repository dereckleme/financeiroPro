import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useCategories } from '../hooks/useCategories';

interface Props {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: Props) {
  const { data: categories } = useCategories();
  const category = categories?.find(c => c.id === transaction.categoria_id);
  const isIncome = transaction.tipo === 'receita';
  const sign = isIncome ? '+' : '-';
  const valueColor = isIncome ? '#22c55e' : '#ef4444';

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: category?.cor + '20' ?? '#1e293b' }]}>
        <Text style={styles.emoji}>{category?.icone ?? '📌'}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.descricao}
        </Text>
        <Text style={styles.meta}>
          {category?.nome ?? '—'} · {formatDate(transaction.data)}
        </Text>
      </View>

      <Text style={[styles.value, { color: valueColor }]}>
        {sign} {formatCurrency(transaction.valor)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
});
