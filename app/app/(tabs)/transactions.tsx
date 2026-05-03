import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTransactions } from '../../src/hooks/useTransactions';
import TransactionItem from '../../src/components/TransactionItem';
import { TransactionType } from '../../src/types';

type Filter = 'todos' | TransactionType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'receita', label: 'Receitas' },
  { key: 'despesa', label: 'Despesas' },
];

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<Filter>('todos');
  const { data: transactions, isLoading, refetch } = useTransactions();

  const filtered = transactions?.filter(t =>
    filter === 'todos' ? true : t.tipo === filter,
  ) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#4f46e5" />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma transação encontrada</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  filters: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  chipActive: { backgroundColor: '#4f46e5' },
  chipText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  empty: { color: '#475569', textAlign: 'center', paddingVertical: 40, fontSize: 15 },
});
