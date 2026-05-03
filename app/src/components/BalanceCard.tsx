import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/formatters';

interface Props {
  balance: number;
  income: number;
  expense: number;
}

export default function BalanceCard({ balance, income, expense }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Saldo total</Text>
      <Text style={[styles.balance, balance < 0 && styles.negative]}>
        {formatCurrency(balance)}
      </Text>

      <View style={styles.row}>
        <View style={styles.item}>
          <View style={[styles.dot, styles.greenDot]} />
          <View>
            <Text style={styles.itemLabel}>Receitas</Text>
            <Text style={styles.incomeValue}>{formatCurrency(income)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <View style={[styles.dot, styles.redDot]} />
          <View>
            <Text style={styles.itemLabel}>Despesas</Text>
            <Text style={styles.expenseValue}>{formatCurrency(expense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  balance: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
  },
  negative: {
    color: '#ef4444',
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  greenDot: { backgroundColor: '#22c55e' },
  redDot: { backgroundColor: '#ef4444' },
  itemLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  incomeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },
  expenseValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
