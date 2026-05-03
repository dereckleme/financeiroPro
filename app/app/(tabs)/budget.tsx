import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useCategories } from '../../src/hooks/useCategories';
import { formatCurrency, currentMonthKey } from '../../src/utils/formatters';

export default function BudgetScreen() {
  const monthKey = currentMonthKey();
  const { data: transactions, isLoading: loadingTx } = useTransactions();
  const { data: categories, isLoading: loadingCat } = useCategories('despesa');

  const isLoading = loadingTx || loadingCat;

  const monthExpenses = transactions?.filter(
    t => t.tipo === 'despesa' && t.data.startsWith(monthKey),
  ) ?? [];

  const byCategory = categories?.map(cat => {
    const total = monthExpenses
      .filter(t => t.categoria_id === cat.id)
      .reduce((s, t) => s + t.valor, 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total) ?? [];

  const grandTotal = byCategory.reduce((s, c) => s + c.total, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.label}>Total gasto este mês</Text>
          <Text style={styles.total}>{formatCurrency(grandTotal)}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#4f46e5" style={{ marginTop: 40 }} />
        ) : byCategory.length === 0 ? (
          <Text style={styles.empty}>Nenhuma despesa registrada este mês</Text>
        ) : (
          byCategory.map(cat => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.dot, { backgroundColor: cat.cor }]} />
              <Text style={styles.emoji}>{cat.icone}</Text>
              <View style={styles.info}>
                <Text style={styles.catName}>{cat.nome}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: cat.cor,
                        width: `${grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.catValue, { color: cat.cor }]}>
                {formatCurrency(cat.total)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    gap: 4,
  },
  label: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  total: { fontSize: 30, fontWeight: '800', color: '#f8fafc' },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  emoji: { fontSize: 18, width: 24, textAlign: 'center' },
  info: { flex: 1, gap: 4 },
  catName: { fontSize: 14, color: '#f8fafc', fontWeight: '600' },
  barBg: { height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  catValue: { fontSize: 13, fontWeight: '700' },
  empty: { color: '#475569', textAlign: 'center', paddingVertical: 40, fontSize: 15 },
});
