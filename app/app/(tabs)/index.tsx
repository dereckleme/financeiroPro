import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useAccounts } from '../../src/hooks/useAccounts';
import BalanceCard from '../../src/components/BalanceCard';
import TransactionItem from '../../src/components/TransactionItem';
import { currentMonthKey } from '../../src/utils/formatters';

export default function DashboardScreen() {
  const { data: transactions, isLoading: loadingTx, refetch: refetchTx } = useTransactions();
  const { data: accounts, isLoading: loadingAcc, refetch: refetchAcc } = useAccounts();

  const isLoading = loadingTx || loadingAcc;

  const totalBalance = accounts?.reduce((sum, a) => sum + a.saldo_atual, 0) ?? 0;
  const monthKey = currentMonthKey();
  const monthTxs = transactions?.filter(t => t.data.startsWith(monthKey)) ?? [];
  const totalIncome = monthTxs.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalExpense = monthTxs.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const recent = transactions?.slice(0, 10) ?? [];

  async function onRefresh() {
    await Promise.all([refetchTx(), refetchAcc()]);
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        <BalanceCard balance={totalBalance} income={totalIncome} expense={totalExpense} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas transações</Text>
          {recent.length === 0 ? (
            <Text style={styles.empty}>Nenhuma transação registrada ainda</Text>
          ) : (
            recent.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  loading: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  empty: { color: '#475569', textAlign: 'center', paddingVertical: 32, fontSize: 15 },
});
